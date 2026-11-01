// =========================================
// HeatLoss.js floor plan model
//
// Pure geometry (no DOM) that turns a 2D floor plan into a standard
// heatlossjs config object that calculate() understands.
//
// Plan coordinates are in metres, x to the right, y down the screen.
// Rooms are polygons stored clockwise on screen. Walls are usually square to
// the grid but can be at any angle.
// =========================================
var floorplan_model = (function () {

    var EPS = 0.001;
    var OPENING_TOL = 0.03;

    var ORIENTATIONS = ["North","North East","East","South East","South","South West","West","North West"];

    function clone(o) { return JSON.parse(JSON.stringify(o)); }

    function round(v, dp) {
        var f = Math.pow(10, dp==undefined ? 3 : dp);
        return Math.round(v*f)/f;
    }

    // ----------------------------------------------------------------------------------------
    // Polygon helpers
    // ----------------------------------------------------------------------------------------
    function signed_area(pts) {
        var a = 0;
        for (var i=0; i<pts.length; i++) {
            var p = pts[i], q = pts[(i+1)%pts.length];
            a += p[0]*q[1] - q[0]*p[1];
        }
        return a/2;
    }

    function area(pts) { return Math.abs(signed_area(pts)); }

    function point_in_polygon(x, y, pts) {
        var inside = false;
        for (var i=0, j=pts.length-1; i<pts.length; j=i++) {
            var xi=pts[i][0], yi=pts[i][1], xj=pts[j][0], yj=pts[j][1];
            if (((yi>y)!=(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)) inside = !inside;
        }
        return inside;
    }

    function bbox(pts) {
        var b = {x1:Infinity, y1:Infinity, x2:-Infinity, y2:-Infinity};
        pts.forEach(function(p) {
            b.x1 = Math.min(b.x1,p[0]); b.y1 = Math.min(b.y1,p[1]);
            b.x2 = Math.max(b.x2,p[0]); b.y2 = Math.max(b.y2,p[1]);
        });
        return b;
    }

    function centroid(pts) {
        // Centre of the largest cell of the polygon, always inside for L and U shapes
        var xs = unique_sorted(pts.map(function(p){return p[0]}));
        var ys = unique_sorted(pts.map(function(p){return p[1]}));
        var best = null, best_area = -1;
        for (var i=0; i<xs.length-1; i++) {
            for (var j=0; j<ys.length-1; j++) {
                var cx = (xs[i]+xs[i+1])/2, cy = (ys[j]+ys[j+1])/2;
                if (!point_in_polygon(cx,cy,pts)) continue;
                var a = (xs[i+1]-xs[i])*(ys[j+1]-ys[j]);
                if (a>best_area) { best_area = a; best = [cx,cy]; }
            }
        }
        if (best) {
            // prefer the bounding box centre when it lies inside the room
            var b = bbox(pts), bx = (b.x1+b.x2)/2, by = (b.y1+b.y2)/2;
            if (point_in_polygon(bx,by,pts)) return [bx,by];
            return best;
        }
        return [pts[0][0],pts[0][1]];
    }

    function unique_sorted(values) {
        values = values.slice().sort(function(a,b){return a-b});
        var out = [];
        values.forEach(function(v) {
            if (!out.length || Math.abs(v-out[out.length-1])>EPS) out.push(v);
        });
        return out;
    }

    function cross3(a, b, c) {
        return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
    }

    // Split a simple polygon into triangles by ear clipping
    function triangulate(pts) {
        var p = clean_polygon(pts), idx = p.map(function(q,i){ return i; }), tris = [];
        while (idx.length>3) {
            var found = false;
            for (var i=0; i<idx.length && !found; i++) {
                var a = p[idx[(i+idx.length-1)%idx.length]], b = p[idx[i]], c = p[idx[(i+1)%idx.length]];
                if (cross3(a,b,c)<=1e-12) continue;
                var blocked = idx.some(function(j) {
                    var q = p[j];
                    if (q===a || q===b || q===c) return false;
                    return cross3(a,b,q)>0 && cross3(b,c,q)>0 && cross3(c,a,q)>0;
                });
                if (blocked) continue;
                tris.push([a,b,c]);
                idx.splice(i,1);
                found = true;
            }
            if (!found) break;
        }
        if (idx.length==3) tris.push(idx.map(function(i){ return p[i]; }));
        return tris;
    }

    // Clip a polygon by a convex polygon (both clockwise on screen)
    function clip_convex(subject, clipper) {
        var out = subject;
        for (var i=0; i<clipper.length && out.length; i++) {
            var a = clipper[i], b = clipper[(i+1)%clipper.length], input = out;
            out = [];
            for (var j=0; j<input.length; j++) {
                var p = input[j], q = input[(j+1)%input.length];
                var sp = cross3(a,b,p), sq = cross3(a,b,q);
                if (sp>=0) out.push(p);
                if ((sp>=0)!=(sq>=0)) {
                    var t = sp/(sp-sq);
                    out.push([p[0]+(q[0]-p[0])*t, p[1]+(q[1]-p[1])*t]);
                }
            }
        }
        return out;
    }

    // Area of overlap between two polygons
    function intersection_area(a, b) {
        var ba = bbox(a), bb = bbox(b);
        if (ba.x2<=bb.x1+EPS || bb.x2<=ba.x1+EPS || ba.y2<=bb.y1+EPS || bb.y2<=ba.y1+EPS) return 0;
        if (!is_orthogonal(a) || !is_orthogonal(b)) {
            var total = 0, tb = triangulate(b);
            triangulate(a).forEach(function(ta) {
                tb.forEach(function(t) {
                    var c = clip_convex(ta, t);
                    if (c.length>2) total += area(c);
                });
            });
            return total;
        }
        // exact for axis aligned shapes
        var xs = unique_sorted(a.concat(b).map(function(p){return p[0]}));
        var ys = unique_sorted(a.concat(b).map(function(p){return p[1]}));
        var total = 0;
        for (var i=0; i<xs.length-1; i++) {
            for (var j=0; j<ys.length-1; j++) {
                var cx = (xs[i]+xs[i+1])/2, cy = (ys[j]+ys[j+1])/2;
                if (point_in_polygon(cx,cy,a) && point_in_polygon(cx,cy,b)) {
                    total += (xs[i+1]-xs[i])*(ys[j+1]-ys[j]);
                }
            }
        }
        return total;
    }

    function rects_overlap(a, b) {
        return a.x1<b.x2-EPS && b.x1<a.x2-EPS && a.y1<b.y2-EPS && b.y1<a.y2-EPS;
    }

    // Area of a polygon that lies over wall footprints of another floor without
    // also being over one of that floor's rooms. Exact when everything is square
    // to the grid, otherwise measured on a 5cm grid.
    function area_over_walls(pts, rooms, bands) {
        var b = bbox(pts);
        bands = bands.filter(function(r){ return rects_overlap(b, bbox(r)); });
        if (!bands.length) return 0;
        rooms = rooms.filter(function(p){ return rects_overlap(b, bbox(p)); });
        var xs = [], ys = [];
        [pts].concat(bands, rooms).forEach(function(p){ p.forEach(function(q){ xs.push(q[0]); ys.push(q[1]); }); });
        if (![pts].concat(bands, rooms).every(is_orthogonal)) {
            for (var x=b.x1; x<b.x2; x+=0.05) xs.push(x);
            for (var y=b.y1; y<b.y2; y+=0.05) ys.push(y);
        }
        xs = unique_sorted(xs.filter(function(x){ return x>=b.x1-EPS && x<=b.x2+EPS; }));
        ys = unique_sorted(ys.filter(function(y){ return y>=b.y1-EPS && y<=b.y2+EPS; }));
        var total = 0;
        for (var i=0; i<xs.length-1; i++) {
            for (var j=0; j<ys.length-1; j++) {
                var cx = (xs[i]+xs[i+1])/2, cy = (ys[j]+ys[j+1])/2;
                if (!point_in_polygon(cx,cy,pts)) continue;
                if (!bands.some(function(r){ return point_in_polygon(cx,cy,r); })) continue;
                if (rooms.some(function(p){ return point_in_polygon(cx,cy,p); })) continue;
                total += (xs[i+1]-xs[i])*(ys[j+1]-ys[j]);
            }
        }
        return total;
    }

    // Edge list with axis ('h', 'v' or 'd' for angled), outward normal and the line it lies on.
    // Each line has a direction (ax,ay) that is the same for both faces of a wall, positions
    // along it run from lo to hi, and k is the offset of the line along (mx,my) = (-ay,ax).
    // c is the familiar coordinate of the line: y for 'h', x for 'v' and k for 'd'.
    function edges(pts) {
        var list = [];
        for (var i=0; i<pts.length; i++) {
            var p = pts[i], q = pts[(i+1)%pts.length];
            var e = {i:i, x1:p[0], y1:p[1], x2:q[0], y2:q[1]};
            var dx = q[0]-p[0], dy = q[1]-p[1];
            e.len = Math.sqrt(dx*dx+dy*dy);
            e.ux = e.len>0 ? dx/e.len : 1; e.uy = e.len>0 ? dy/e.len : 0;
            if (Math.abs(dy)<EPS) {
                e.axis = 'h'; e.ax = 1; e.ay = 0;
                e.nx = 0; e.ny = dx>0 ? -1 : 1;
            } else if (Math.abs(dx)<EPS) {
                e.axis = 'v'; e.ax = 0; e.ay = 1;
                e.nx = dy>0 ? 1 : -1; e.ny = 0;
            } else {
                e.axis = 'd';
                e.ax = e.ux>0 ? e.ux : -e.ux; e.ay = e.ux>0 ? e.uy : -e.uy;
                e.nx = dy/e.len; e.ny = -dx/e.len;
            }
            e.mx = -e.ay; e.my = e.ax;
            e.k = p[0]*e.mx + p[1]*e.my;
            var s1 = p[0]*e.ax + p[1]*e.ay, s2 = q[0]*e.ax + q[1]*e.ay;
            e.lo = Math.min(s1,s2); e.hi = Math.max(s1,s2);
            e.c = e.axis=='h' ? p[1] : (e.axis=='v' ? p[0] : e.k);
            list.push(e);
        }
        return list;
    }

    // Position along a line (an edge or wall) of a point
    function along(l, x, y) { return x*l.ax + y*l.ay; }

    // Point on a line at position s along it, offset d along its outward normal
    function line_point(l, s, d) {
        return [l.ax*s + l.mx*l.k + l.nx*(d||0), l.ay*s + l.my*l.k + l.ny*(d||0)];
    }

    function opening_dir(op) {
        if (op.axis=='h') return [1,0];
        if (op.axis=='v') return [0,1];
        return op.dir || [1,0];
    }

    // Position along an edge or wall of a window or door lying in it, or null. The
    // opening can sit anywhere from the face of the line out to depth (the wall gap).
    function opening_along(op, l, depth) {
        var d = opening_dir(op);
        if (Math.abs(d[0]*l.ay - d[1]*l.ax)>0.001) return null;
        var off = (op.x*l.mx + op.y*l.my - l.k)*(l.nx*l.mx + l.ny*l.my);
        if (off<-OPENING_TOL || off>(depth||0)+OPENING_TOL) return null;
        return along(l, op.x, op.y);
    }

    // Do two segments cross (touching at ends does not count)
    function segments_cross(a, b, c, d) {
        var d1 = cross3(c,d,a), d2 = cross3(c,d,b), d3 = cross3(a,b,c), d4 = cross3(a,b,d);
        return ((d1>EPS*EPS && d2<-EPS*EPS) || (d1<-EPS*EPS && d2>EPS*EPS)) &&
               ((d3>EPS*EPS && d4<-EPS*EPS) || (d3<-EPS*EPS && d4>EPS*EPS));
    }

    // A polygon whose walls do not cross each other
    function is_simple(pts) {
        var n = pts.length;
        for (var i=0; i<n; i++) {
            for (var j=i+2; j<n; j++) {
                if (i==0 && j==n-1) continue;
                if (segments_cross(pts[i], pts[(i+1)%n], pts[j], pts[(j+1)%n])) return false;
            }
        }
        return true;
    }

    function is_orthogonal(pts) {
        return edges(pts).every(function(e) { return e.axis!='d'; });
    }

    // Snap to mm, drop duplicate and collinear points, make clockwise on screen
    function clean_polygon(pts) {
        pts = pts.map(function(p) { return [round(p[0]),round(p[1])]; });
        var changed = true;
        while (changed && pts.length>2) {
            changed = false;
            for (var i=0; i<pts.length; i++) {
                var a = pts[(i+pts.length-1)%pts.length], b = pts[i], c = pts[(i+1)%pts.length];
                var same = Math.abs(a[0]-b[0])<EPS && Math.abs(a[1]-b[1])<EPS;
                var cross = (b[0]-a[0])*(c[1]-b[1]) - (b[1]-a[1])*(c[0]-b[0]);
                if (same || Math.abs(cross)<EPS*EPS) {
                    pts.splice(i,1);
                    changed = true;
                    break;
                }
            }
        }
        if (signed_area(pts)<0) pts.reverse();
        return pts;
    }

    // Union of touching or overlapping orthogonal polygons.
    // Returns a single polygon, or null if the result would be disjoint or have holes.
    function union(polys) {
        if (!polys.every(is_orthogonal)) return null;
        var all = [];
        polys.forEach(function(p){ all = all.concat(p); });
        var xs = unique_sorted(all.map(function(p){return p[0]}));
        var ys = unique_sorted(all.map(function(p){return p[1]}));
        var nx = xs.length-1, ny = ys.length-1;

        var filled = [];
        for (var i=0; i<nx; i++) {
            filled[i] = [];
            for (var j=0; j<ny; j++) {
                var cx = (xs[i]+xs[i+1])/2, cy = (ys[j]+ys[j+1])/2;
                filled[i][j] = polys.some(function(p){ return point_in_polygon(cx,cy,p); });
            }
        }
        function is_filled(i,j) { return i>=0 && j>=0 && i<nx && j<ny && filled[i][j]; }

        var out = {}, count = 0;
        function add(x1,y1,x2,y2) {
            var key = x1+","+y1;
            if (out[key]) out[key].dup = true;
            out[key] = {from:[x1,y1], to:[x2,y2], dup: out[key] ? true : false};
            count++;
        }
        for (var i=0; i<nx; i++) {
            for (var j=0; j<ny; j++) {
                if (!filled[i][j]) continue;
                if (!is_filled(i,j-1)) add(xs[i],ys[j],xs[i+1],ys[j]);
                if (!is_filled(i+1,j)) add(xs[i+1],ys[j],xs[i+1],ys[j+1]);
                if (!is_filled(i,j+1)) add(xs[i+1],ys[j+1],xs[i],ys[j+1]);
                if (!is_filled(i-1,j)) add(xs[i],ys[j+1],xs[i],ys[j]);
            }
        }
        var keys = Object.keys(out);
        if (!keys.length) return null;
        if (keys.length!=count) return null;   // pinch point, ambiguous outline

        var pts = [], key = keys[0], used = 0;
        while (out[key] && !out[key].used) {
            out[key].used = true; used++;
            pts.push(out[key].from);
            key = out[key].to[0]+","+out[key].to[1];
        }
        if (used!=count) return null;          // disjoint shapes or holes
        return clean_polygon(pts);
    }

    function orientation_name(nx, ny, north) {
        var bearing = Math.atan2(nx, -ny)*180/Math.PI;
        var a = ((bearing - (north||0)) % 360 + 360) % 360;
        return ORIENTATIONS[Math.round(a/45)%8];
    }

    // After a polygon has changed shape, carry per edge settings across to the
    // new edges that lie on the same line as an old edge
    function remap_edge_props(old_rooms, new_pts) {
        var result = {};
        edges(new_pts).forEach(function(ne) {
            var mx = (ne.x1+ne.x2)/2, my = (ne.y1+ne.y2)/2;
            old_rooms.forEach(function(old) {
                if (!old.edges) return;
                edges(old.points).forEach(function(oe) {
                    if (result[ne.i] || !old.edges[oe.i] || oe.len<EPS) return;
                    if (Math.abs(oe.nx-ne.nx)>0.001 || Math.abs(oe.ny-ne.ny)>0.001) return;
                    var s = along(oe, mx, my), k = mx*oe.mx + my*oe.my;
                    if (Math.abs(k-oe.k)<0.002 && s>=oe.lo-EPS && s<=oe.hi+EPS) {
                        result[ne.i] = clone(old.edges[oe.i]);
                    }
                });
            });
        });
        return result;
    }

    // Openings (windows and doors) that sit on the edges of a room, with their
    // distance from the start of that edge, used to carry them along when editing
    function openings_on_room(plan, room) {
        var list = [];
        var room_edges = edges(room.points);
        plan.openings.forEach(function(op) {
            if (op.level!=room.level) return;
            room_edges.forEach(function(e) {
                if (e.len<EPS) return;
                var t = opening_along(op, e, 0);
                if (t===null || t<e.lo-EPS || t>e.hi+EPS) return;
                list.push({opening: op, edge: e.i, dist: Math.abs(t-along(e, e.x1, e.y1))});
            });
        });
        return list;
    }

    // Thickness of the parts of a wall that are not shared with another room,
    // shared walls take their thickness from the gap between the two rooms
    function edge_thickness(plan, p) {
        p = p || {};
        if (typeof p.thickness=='number' && p.thickness>=0) return p.thickness;
        var t = plan.wall_thickness || {};
        if (p.boundary && p.boundary!='external') return t.party>=0 ? 1*t.party : 0.2;
        return t.external>=0 ? 1*t.external : 0.3;
    }

    function guess_temperature(name) {
        var n = (name||"").toLowerCase();
        if (/bath|shower|en.?suite/.test(n)) return 22;
        if (/living|lounge|sitting|dining|family|study|office|snug|play/.test(n)) return 21;
        if (/bed|nursery/.test(n)) return 18;
        if (/kitchen|hall|landing|stair|utility|wc|toilet|cloak|porch|store/.test(n)) return 18;
        return null;
    }

    // ----------------------------------------------------------------------------------------
    // Convert plan into heatlossjs config
    // ----------------------------------------------------------------------------------------
    function analyse(plan) {
        var warnings = [];
        var d = plan.defaults;

        var config = {
            heatlossjs_version: 3,
            project_name: plan.project_name,
            degreedays: plan.degreedays,
            heating_MWT: plan.heating_MWT,
            heatpump_flow_rate: plan.heatpump_flow_rate,
            heatpump_capacity: plan.heatpump_capacity,
            cop_calculation_method: plan.cop_calculation_method,
            T: clone(plan.T),
            element_type: clone(plan.element_type),
            rooms: {},
            elements: []
        };

        var first_type = Object.keys(config.element_type)[0];
        var missing = {};
        function type_or_default(t, fallback) {
            if (t && config.element_type[t]!=undefined) return t;
            if (t && !missing[t]) { missing[t] = true; warnings.push("Element type \""+t+"\" no longer exists, using a default"); }
            if (config.element_type[fallback]!=undefined) return fallback;
            if (fallback && !missing[fallback]) { missing[fallback] = true; warnings.push("Default element type \""+fallback+"\" no longer exists"); }
            return first_type;
        }
        function boundary_or(b, fallback) {
            return (b && config.T[b]!=undefined) ? b : fallback;
        }

        var level_index = {}, level_by_id = {};
        plan.levels.forEach(function(l,i){ level_index[l.id] = i; level_by_id[l.id] = l; });

        var by_level = {};
        plan.levels.forEach(function(l){ by_level[l.id] = []; });
        var room_index = {};
        plan.rooms.forEach(function(r,i) {
            room_index[r.id] = i;
            if (by_level[r.level]) by_level[r.level].push(r);
        });

        function room_height(r) {
            if (r.height>0) return 1*r.height;
            return 1*level_by_id[r.level].height;
        }

        // Unique room names, used as keys in config.rooms
        var names = {}, used = {};
        plan.rooms.forEach(function(r) {
            var base = (r.name||"").trim() || "Room";
            var n = base, k = 2;
            while (used[n] || config.T[n]!=undefined) n = base+" "+(k++);
            if (n!=base && r.heated) warnings.push("Two rooms are called \""+base+"\", the second is exported as \""+n+"\"");
            used[n] = true;
            names[r.id] = n;
        });

        var info = {};
        plan.rooms.forEach(function(r) {
            info[r.id] = { name: names[r.id], area: area(r.points), height: room_height(r) };
            if (!r.heated) return;
            config.rooms[names[r.id]] = {
                temperature: 1*r.temperature,
                area: round(info[r.id].area),
                height: room_height(r),
                air_change_an_hour: 1*r.ach,
                elements: [],
                radiators: clone(r.radiators||[]),
                ufh: clone(r.ufh||[])
            };
        });

        // Each item becomes one element, referenced by one room or linked between two
        var items = [];
        function add_item(el, refs, subtract) {
            items.push({el: el, refs: refs, subtract: subtract});
            return items.length-1;
        }

        var walls = [];
        var shared = [];
        var used_openings = {};
        var gap = plan.wall_gap>=0 ? 1*plan.wall_gap : 0.35;

        // ------------------------------------------------------------------
        // Walls
        // ------------------------------------------------------------------
        // Split each edge into stretches shared with a neighbouring room and stretches that are not
        var segs = [], seg_by = {};
        plan.rooms.forEach(function(R) {
            if (!by_level[R.level]) return;
            var others = by_level[R.level].filter(function(S){ return S!==R; });
            var props = R.edges || {};
            var room_edges = edges(R.points);

            room_edges.forEach(function(e) {
                var p = props[e.i] || {};
                // zero length edges are split points waiting to be dragged into a step
                var pieces = e.len<EPS ? [] : [{lo:e.lo, hi:e.hi, other:null}];

                if (pieces.length) {
                    var candidates = [];
                    var side = e.nx*e.mx + e.ny*e.my;
                    others.forEach(function(S) {
                        edges(S.points).forEach(function(f) {
                            if (f.len<EPS || Math.abs(f.nx+e.nx)>0.001 || Math.abs(f.ny+e.ny)>0.001) return;
                            var dist = (f.k-e.k)*side;
                            if (dist<-EPS || dist>gap+EPS) return;
                            var lo = Math.max(e.lo,f.lo), hi = Math.min(e.hi,f.hi);
                            if (hi-lo<0.01) return;
                            candidates.push({lo:lo, hi:hi, other:S, edge:f.i, dist:dist});
                        });
                    });
                    candidates.sort(function(a,b){ return a.dist-b.dist; });
                    candidates.forEach(function(c) {
                        var next = [];
                        pieces.forEach(function(pc) {
                            if (pc.other || c.hi<=pc.lo || c.lo>=pc.hi) { next.push(pc); return; }
                            var lo = Math.max(pc.lo,c.lo), hi = Math.min(pc.hi,c.hi);
                            if (lo-pc.lo>0.005) next.push({lo:pc.lo, hi:lo, other:null});
                            next.push({lo:lo, hi:hi, other:c.other, edge:c.edge, dist:c.dist});
                            if (pc.hi-hi>0.005) next.push({lo:hi, hi:pc.hi, other:null});
                        });
                        pieces = next;
                    });
                }

                var t = edge_thickness(plan, p);
                pieces.forEach(function(pc){ pc.thick = pc.other ? pc.dist : t; });
                var seg = {R:R, e:e, p:p, pieces:pieces, n:room_edges.length};
                segs.push(seg);
                seg_by[R.id+":"+e.i] = seg;
            });
        });

        // Footprint of each stretch of wall, extended round outside corners so walls join up
        function thick_at(seg, x, y) {
            var t = along(seg.e, x, y);
            for (var k=0; k<seg.pieces.length; k++) {
                var pc = seg.pieces[k];
                if (Math.abs(pc.lo-t)<EPS || Math.abs(pc.hi-t)<EPS) return pc.thick;
            }
            return 0;
        }
        function convex(a, b) {
            return (a.x2-a.x1)*(b.y2-b.y1) - (a.y2-a.y1)*(b.x2-b.x1) > EPS;
        }
        segs.forEach(function(s) {
            var e = s.e;
            s.prev = seg_by[s.R.id+":"+((e.i+s.n-1)%s.n)];
            s.next = seg_by[s.R.id+":"+((e.i+1)%s.n)];
            s.convex_start = convex(s.prev.e, e);
            s.convex_end = convex(e, s.next.e);
            var forward = (e.x2-e.x1)*e.ax + (e.y2-e.y1)*e.ay > 0;
            s.forward = forward;
            s.convex_lo = forward ? s.convex_start : s.convex_end;
            s.convex_hi = forward ? s.convex_end : s.convex_start;
        });

        // A short stretch next to a shared wall, that ends at another shared wall or at an
        // inside corner, is where internal walls meet this one. It is part of the wall
        // junction rather than an outside wall.
        segs.forEach(function(s) {
            var pieces = s.pieces;
            pieces.forEach(function(pc, k) {
                if (pc.other || pc.hi-pc.lo>gap+EPS) return;
                var before = k>0 ? pieces[k-1] : null, after = k<pieces.length-1 ? pieces[k+1] : null;
                if (!(before && before.other) && !(after && after.other)) return;
                if (before ? !before.other : s.convex_lo) return;
                if (after ? !after.other : s.convex_hi) return;
                pc.junction = true;
                pc.thick = Math.max(before && before.other ? before.dist : 0, after && after.other ? after.dist : 0);
            });
        });

        // Where the outside faces of two walls meet at a corner, or null if they are
        // close to parallel and the corner would run off into a long spike
        function miter(V, e1, t1, e2, t2) {
            var rx = e2.nx*t2 - e1.nx*t1, ry = e2.ny*t2 - e1.ny*t1;
            var det = e2.ux*e1.uy - e1.ux*e2.uy;
            if (Math.abs(det)<1e-6) return null;
            var l = (e2.ux*ry - rx*e2.uy)/det;
            var P = [V[0]+e1.nx*t1+e1.ux*l, V[1]+e1.ny*t1+e1.uy*l];
            var dx = P[0]-V[0], dy = P[1]-V[1];
            if (Math.sqrt(dx*dx+dy*dy) > 4*Math.max(t1,t2)+0.01) return null;
            return P;
        }
        segs.forEach(function(s) {
            var e = s.e;
            if (e.len<EPS) return;
            // lo and hi ends of the edge, which corner they are at and the wall beyond it
            var ends = {
                lo: s.forward ? { V:[e.x1,e.y1], adj:s.prev, convex:s.convex_start, dir:-1 } : { V:[e.x2,e.y2], adj:s.next, convex:s.convex_end, dir:-1 },
                hi: s.forward ? { V:[e.x2,e.y2], adj:s.next, convex:s.convex_end, dir:1 } : { V:[e.x1,e.y1], adj:s.prev, convex:s.convex_start, dir:1 }
            };
            s.pieces.forEach(function(pc) {
                if (pc.thick<EPS) return;
                var inner = { lo: line_point(e, pc.lo), hi: line_point(e, pc.hi) };
                var outer = { lo: line_point(e, pc.lo, pc.thick), hi: line_point(e, pc.hi, pc.thick) };
                ['lo','hi'].forEach(function(end) {
                    var x = ends[end];
                    if (Math.abs(pc[end]-e[end])>EPS || x.adj.e.len<EPS) return;
                    var square = e.axis!='d' && x.adj.e.axis!='d';
                    // square inside corners already meet, angled ones need joining
                    if (!x.convex && square) return;
                    var t2 = thick_at(x.adj, x.V[0], x.V[1]);
                    if (square) {
                        // square corner: run this wall on past the corner by the other wall's thickness
                        inner[end] = [inner[end][0]+e.ax*x.dir*t2, inner[end][1]+e.ay*x.dir*t2];
                        outer[end] = [outer[end][0]+e.ax*x.dir*t2, outer[end][1]+e.ay*x.dir*t2];
                    } else {
                        var P = miter(x.V, e, pc.thick, x.adj.e, t2);
                        if (P) outer[end] = P;
                    }
                });
                pc.band = [inner.lo, inner.hi, outer.hi, outer.lo];
            });
        });

        segs.forEach(function(s) {
            var R = s.R, e = s.e, p = s.p;
            s.pieces.forEach(function(pc) {
                var S = pc.other;
                var wall = {
                    level: R.level, room: R.id, edge: e.i, axis: e.axis, c: e.c,
                    ax: e.ax, ay: e.ay, mx: e.mx, my: e.my, k: e.k,
                    lo: pc.lo, hi: pc.hi, len: pc.hi-pc.lo, nx: e.nx, ny: e.ny,
                    other: S ? S.id : null, other_edge: S ? pc.edge : null, dist: S ? pc.dist : 0,
                    thick: pc.thick, band: pc.band || null,
                    boundary: null, type: null, orientation: "", item: null, openings: []
                };
                var a = line_point(e, pc.lo), b = line_point(e, pc.hi);
                wall.x1 = a[0]; wall.y1 = a[1]; wall.x2 = b[0]; wall.y2 = b[1];
                walls.push(wall);

                var h = room_height(R);

                if (pc.junction) {
                    wall.kind = R.heated ? 'junction' : 'unheated_internal';
                    return;
                }

                if (!R.heated) {
                    wall.kind = S ? (S.heated ? 'unheated_side' : 'unheated_internal') : 'unheated_external';
                    return;
                }

                var refs;
                if (S && S.heated) {
                    wall.kind = 'internal';
                    wall.boundary = names[S.id];
                    var other_props = (S.edges||{})[pc.edge] || {};
                    wall.type = type_or_default(p.int_type || other_props.int_type, d.wall_internal);
                    if (room_index[R.id] > room_index[S.id]) {
                        // Element already created from the other side
                        for (var z=0; z<shared.length; z++) {
                            var s = shared[z];
                            if (s.a==S.id && s.b==R.id && Math.abs(s.ax*e.ay-s.ay*e.ax)<0.001 && s.lo<pc.hi-EPS && s.hi>pc.lo+EPS) {
                                wall.item = s.item;
                                wall.openings = s.wall.openings;
                                break;
                            }
                        }
                        if (wall.item!==null) return;
                    }
                    refs = [{room:R.id, boundary:names[S.id]}, {room:S.id, boundary:names[R.id]}];
                    wall.item = add_item({type: wall.type, orientation: "", width: round(wall.len), height: Math.min(h,room_height(S))}, refs);
                    shared.push({a:R.id, b:S.id, ax:e.ax, ay:e.ay, lo:pc.lo, hi:pc.hi, item:wall.item, wall:wall});
                } else {
                    if (S) {
                        wall.kind = 'unheated';
                        wall.boundary = 'unheated';
                    } else {
                        wall.kind = 'external';
                        wall.boundary = boundary_or(p.boundary, 'external');
                    }
                    wall.type = type_or_default(p.ext_type, d.wall_external);
                    wall.orientation = orientation_name(e.nx, e.ny, plan.north);
                    refs = [{room:R.id, boundary:wall.boundary}];
                    wall.item = add_item({type: wall.type, orientation: wall.orientation, width: round(wall.len), height: h}, refs);
                }

                // Windows and doors on this stretch of wall
                plan.openings.forEach(function(op) {
                    if (used_openings[op.id] || op.level!=R.level) return;
                    var t = opening_along(op, e, wall.dist);
                    if (t===null || t<pc.lo-EPS || t>pc.hi+EPS) return;
                    used_openings[op.id] = true;
                    wall.openings.push(op.id);
                    var fallback = op.kind=='door' ? d.door : d.window;
                    add_item({
                        type: type_or_default(op.type, fallback),
                        orientation: wall.orientation,
                        width: 1*op.width,
                        height: 1*op.height
                    }, refs, wall.item);
                });
            });
        });

        var bands_by_level = {};
        plan.levels.forEach(function(l){ bands_by_level[l.id] = []; });
        walls.forEach(function(w){ if (w.band) bands_by_level[w.level].push(w.band); });
        function polys(rooms) { return rooms.map(function(S){ return S.points; }); }

        // ------------------------------------------------------------------
        // Floors and ceilings
        // ------------------------------------------------------------------
        plan.rooms.forEach(function(R) {
            if (!R.heated || level_index[R.level]==undefined) return;
            var li = level_index[R.level];
            var A = info[R.id].area;
            var floor = R.floor || {}, ceiling = R.ceiling || {};

            var below = li>0 ? by_level[plan.levels[li-1].id] : [];
            var covered = 0;
            below.forEach(function(S) {
                var a = intersection_area(R.points, S.points);
                if (a<0.01) return;
                covered += a;
                if (S.heated) {
                    add_item({type: type_or_default(d.floor_intermediate), orientation: "", area: round(a)},
                        [{room:R.id, boundary:names[S.id]}, {room:S.id, boundary:names[R.id]}]);
                } else {
                    add_item({type: type_or_default(floor.type, d.floor_exposed), orientation: "", area: round(a)},
                        [{room:R.id, boundary:'unheated'}]);
                }
            });
            // floor that sits on top of a wall below loses heat into the wall, not to outside
            if (li>0) covered += area_over_walls(R.points, polys(below), bands_by_level[plan.levels[li-1].id]);
            var rem = A-covered;
            if (rem>0.01) {
                if (li==0) {
                    add_item({type: type_or_default(floor.type, d.floor_ground), orientation: "", area: round(rem)},
                        [{room:R.id, boundary: boundary_or(floor.boundary,'ground')}]);
                } else {
                    add_item({type: type_or_default(floor.type, d.floor_exposed), orientation: "", area: round(rem)},
                        [{room:R.id, boundary: boundary_or(floor.boundary,'external')}]);
                }
            }

            var above = li<plan.levels.length-1 ? by_level[plan.levels[li+1].id] : [];
            covered = 0;
            above.forEach(function(S) {
                var a = intersection_area(R.points, S.points);
                if (a<0.01) return;
                covered += a;
                // heated rooms above create the shared element from their side
                if (!S.heated) {
                    add_item({type: type_or_default(ceiling.type, d.floor_intermediate), orientation: "", area: round(a)},
                        [{room:R.id, boundary:'unheated'}]);
                }
            });
            if (above.length) covered += area_over_walls(R.points, polys(above), bands_by_level[plan.levels[li+1].id]);
            rem = A-covered;
            if (rem>0.01) {
                add_item({type: type_or_default(ceiling.type, d.roof), orientation: "", area: round(rem)},
                    [{room:R.id, boundary: boundary_or(ceiling.boundary,'external')}]);
            }

            (R.extra||[]).forEach(function(x) {
                add_item({type: type_or_default(x.type), orientation: "", area: 1*x.area||0},
                    [{room:R.id, boundary: boundary_or(x.boundary,'external')}]);
            });
        });

        // ------------------------------------------------------------------
        // Write elements and room references, linking shared elements
        // ------------------------------------------------------------------
        items.forEach(function(it, idx) {
            var el = it.el;
            if (it.subtract!=undefined) el.subtractfrom = it.subtract;
            config.elements.push(el);
            var entries = it.refs.map(function(ref) {
                var list = config.rooms[names[ref.room]].elements;
                list.push({id: idx, boundary: ref.boundary});
                return {list: list, index: list.length-1};
            });
            if (entries.length==2) {
                entries[0].list[entries[0].index].link = entries[1].index;
                entries[1].list[entries[1].index].link = entries[0].index;
            }
        });

        // ------------------------------------------------------------------
        // Sanity checks
        // ------------------------------------------------------------------
        plan.levels.forEach(function(l) {
            var list = by_level[l.id];
            for (var i=0; i<list.length; i++) {
                for (var j=i+1; j<list.length; j++) {
                    var a = intersection_area(list[i].points, list[j].points);
                    if (a>0.05) warnings.push(names[list[i].id]+" overlaps "+names[list[j].id]+" by "+a.toFixed(1)+" m²");
                }
            }
        });
        plan.openings.forEach(function(op) {
            if (used_openings[op.id]) return;
            var on_unheated = walls.some(function(w) {
                if (!w.kind || w.kind.indexOf('unheated_')!=0 || w.level!=op.level) return false;
                var t = opening_along(op, w, w.dist);
                return t!==null && t>=w.lo-EPS && t<=w.hi+EPS;
            });
            if (!on_unheated) warnings.push("A "+(op.kind||"window")+" is not on a wall and is ignored");
        });

        return { config: config, walls: walls, info: info, names: names, warnings: warnings };
    }

    // ----------------------------------------------------------------------------------------
    // New and example plans
    // ----------------------------------------------------------------------------------------
    function default_plan() {
        return {
            floorplan_version: 1,
            project_name: "new",
            degreedays: 2228,
            heating_MWT: 40,
            heatpump_flow_rate: 10,
            heatpump_capacity: 5,
            cop_calculation_method: "ecodan",
            T: { external: -3, ground: 10, unheated: 10, neighbour: 10 },
            element_type: {
                "Wall:External": { uvalue: 0.3 },
                "Wall:Internal": { uvalue: 1.7 },
                "Wall:Party": { uvalue: 0.5 },
                "Window": { uvalue: 1.6 },
                "Door": { uvalue: 1.6 },
                "Floor:Ground": { uvalue: 0.6 },
                "Floor:Intermediate": { uvalue: 1.7 },
                "Floor:Exposed": { uvalue: 0.5 },
                "Roof": { uvalue: 0.15 }
            },
            defaults: {
                wall_external: "Wall:External",
                wall_internal: "Wall:Internal",
                wall_party: "Wall:Party",
                window: "Window",
                door: "Door",
                floor_ground: "Floor:Ground",
                floor_intermediate: "Floor:Intermediate",
                floor_exposed: "Floor:Exposed",
                roof: "Roof"
            },
            default_ach: 0.5,
            north: 0,
            grid: 0.01,
            wall_gap: 0.35,
            wall_thickness: { external: 0.3, party: 0.2 },
            levels: [{ id: "L1", name: "Ground floor", height: 2.4 }],
            rooms: [],
            openings: [],
            next_id: 2
        };
    }

    function new_room(plan, level, points, name) {
        var r = {
            id: "r"+(plan.next_id++),
            level: level,
            name: name,
            heated: true,
            temperature: guess_temperature(name) || 20,
            temp_auto: true,
            ach: plan.default_ach,
            height: null,
            points: clean_polygon(points),
            edges: {},
            floor: null,
            ceiling: null,
            extra: [],
            radiators: [],
            ufh: []
        };
        plan.rooms.push(r);
        return r;
    }

    function rect(x1,y1,x2,y2) { return [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]; }

    // The stone mid terrace from the main heatlossjs example, measured from the plan at
    // https://trystanlea.org.uk/energyassessment. Rooms are internal dimensions, with
    // 550mm stone walls, a thicker kitchen gable and the old back wall between the
    // kitchen extension and the living room.
    function example_plan() {
        var plan = default_plan();
        plan.project_name = "midterrace";
        plan.degreedays = 1750;
        plan.heating_MWT = 35.3;
        plan.heatpump_flow_rate = 12;
        plan.heatpump_capacity = 5;
        plan.T = { external: -1.4, ground: 10.6, unheated: 18, neighbour: 18 };
        plan.element_type = {
            "Floor:Ground": { uvalue: 0.9 },
            "Floor:InsulatedGround": { uvalue: 0.38 },
            "Floor:First": { uvalue: 1.7 },
            "Floor:Loft": { uvalue: 0.18 },
            "Wall:External": { uvalue: 1.5 },
            "Wall:Internal": { uvalue: 2 },
            "Wall:Party": { uvalue: 1.5 },
            "Glazing:Double": { uvalue: 2.8 },
            "Wall:InternalOpenDoor": { uvalue: 35 }
        };
        plan.defaults = {
            wall_external: "Wall:External",
            wall_internal: "Wall:Internal",
            wall_party: "Wall:Party",
            window: "Glazing:Double",
            door: "Glazing:Double",
            floor_ground: "Floor:Ground",
            floor_intermediate: "Floor:First",
            floor_exposed: "Floor:First",
            roof: "Floor:Loft"
        };
        plan.default_ach = 0.6;
        plan.grid = 0.01;
        plan.wall_gap = 0.6;
        plan.wall_thickness = { external: 0.55, party: 0.5 };
        plan.levels = [
            { id: "L1", name: "Ground floor", height: 2.4 },
            { id: "L2", name: "First floor", height: 2.42 }
        ];
        plan.next_id = 3;

        function room(level, name, pts, extra) {
            var r = new_room(plan, level, pts, name);
            r.temperature = 19;
            r.temp_auto = false;
            for (var z in extra) r[z] = extra[z];
            return r;
        }
        function opening(level, kind, x, y, axis, width, height) {
            plan.openings.push({ id: "o"+(plan.next_id++), level: level, kind: kind, x: x, y: y, axis: axis,
                width: width, height: height, type: null });
        }
        // Set wall properties on the edges of a room that lie on a given line
        function walls_on(r, axis, c, props) {
            edges(r.points).forEach(function(e) {
                if (e.axis==axis && Math.abs(e.c-c)<EPS) r.edges[e.i] = clone(props);
            });
        }
        function rad(name, heat50k) { return { name: name, heat50k: heat50k }; }

        var party = { boundary: "neighbour", ext_type: "Wall:Party" };

        var living = room("L1", "Living room", [[0.33,4.37],[3.69,4.37],[3.69,12.03],[1.16,12.03],[1.16,11.18],[0.33,11.18]], {
            temperature: 20, floor: { type: "Floor:InsulatedGround" },
            radiators: [rad("Double Panel Convector 1200x600",2146), rad("Double Panel Convector 1200x600",2146), rad("Double Panel Convector 1200x600",2146)]
        });
        var hall = room("L1", "Hall", rect(3.80,4.37,4.80,12.03), { height: 2.45, radiators: [rad("Double Panel Convector 1200x600",2146)] });
        var kitchen = room("L1", "Kitchen", rect(2.40,0.80,4.80,3.82), { height: 2.45 });

        var bed1 = room("L2", "Bed 1", rect(0.33,4.37,3.27,7.87), { radiators: [rad("Double Panel Convector 1200x500",1834)] });
        var bed2 = room("L2", "Bed 2", rect(0.33,7.99,2.93,11.16), { radiators: [rad("Double Panel Convector 1200x500",1834)] });
        var landing = room("L2", "Landing", [[3.37,4.37],[4.80,4.37],[4.80,8.79],[3.01,8.79],[3.01,7.99],[3.37,7.99]]);
        var study = room("L2", "Study", rect(3.01,8.92,4.80,11.16), { radiators: [rad("Double Panel Convector 1000x400",1273)] });
        var bathroom = room("L2", "Bathroom", rect(2.40,0.53,4.80,3.82), { radiators: [rad("Double Panel Convector 800x600",1430)] });

        // Party walls with the houses either side
        [living, bed1, bed2].forEach(function(r){ walls_on(r, 'v', 0.33, party); });
        [hall, kitchen, landing, study, bathroom].forEach(function(r){ walls_on(r, 'v', 4.80, party); });
        // Thicker stone gable at the end of the kitchen and the thinner front wall of the bay and porch
        walls_on(kitchen, 'h', 0.80, { thickness: 0.80 });
        walls_on(living, 'v', 1.16, { thickness: 0.29 });
        walls_on(living, 'h', 12.03, { thickness: 0.29 });
        walls_on(hall, 'h', 12.03, { thickness: 0.29 });
        // Wide openings through the old back wall, modelled as in the table example
        walls_on(living, 'h', 4.37, { int_type: "Wall:InternalOpenDoor" });
        walls_on(landing, 'h', 4.37, { int_type: "Wall:InternalOpenDoor" });

        opening("L1","window", 2.04,12.03,'h', 1.76,1.63);  // W1 bay
        opening("L1","window", 1.41,4.37,'h',  1.06,1.5);   // W2
        opening("L1","window", 2.40,1.84,'v',  0.91,1.3);   // W3
        opening("L1","door",   2.40,3.37,'v',  0.89,1.9);   // D1
        opening("L1","door",   4.30,12.03,'h', 0.8,1.9);    // D2
        opening("L2","window", 4.40,11.16,'h', 0.79,1.4);   // W4
        opening("L2","window", 2.01,11.16,'h', 0.9,1.35);   // W5
        opening("L2","window", 1.38,4.37,'h',  0.9,1.3);    // W6
        opening("L2","window", 2.82,0.53,'h',  0.84,0.89);  // W7

        return plan;
    }

    // Typical U-values to help get started, check against the MCS U-value guidance
    var library = [
        { name: "Wall:SolidBrick225", uvalue: 2.1, label: "Solid brick wall 225mm" },
        { name: "Wall:CavityUnfilled", uvalue: 1.5, label: "Cavity wall, unfilled" },
        { name: "Wall:CavityFilled", uvalue: 0.55, label: "Cavity wall, filled" },
        { name: "Wall:Stone", uvalue: 1.7, label: "Solid stone wall 500mm" },
        { name: "Wall:TimberFrame", uvalue: 0.3, label: "Insulated timber frame wall" },
        { name: "Wall:InternalBrick", uvalue: 2.0, label: "Internal brick wall" },
        { name: "Wall:InternalStud", uvalue: 1.7, label: "Internal stud partition" },
        { name: "Glazing:Single", uvalue: 4.8, label: "Single glazing" },
        { name: "Glazing:Double", uvalue: 2.8, label: "Double glazing, older" },
        { name: "Glazing:DoubleModern", uvalue: 1.4, label: "Double glazing, modern" },
        { name: "Glazing:Triple", uvalue: 0.8, label: "Triple glazing" },
        { name: "Roof:Loft100", uvalue: 0.35, label: "Loft, 100mm insulation" },
        { name: "Roof:Loft270", uvalue: 0.16, label: "Loft, 270mm insulation" },
        { name: "Floor:SuspendedTimber", uvalue: 0.7, label: "Suspended timber floor, uninsulated" },
        { name: "Floor:SolidUninsulated", uvalue: 0.7, label: "Solid ground floor, uninsulated" }
    ];

    return {
        EPS: EPS,
        clone: clone,
        round: round,
        area: area,
        signed_area: signed_area,
        point_in_polygon: point_in_polygon,
        bbox: bbox,
        centroid: centroid,
        intersection_area: intersection_area,
        along: along,
        line_point: line_point,
        opening_dir: opening_dir,
        opening_along: opening_along,
        is_simple: is_simple,
        edges: edges,
        is_orthogonal: is_orthogonal,
        clean_polygon: clean_polygon,
        union: union,
        orientation_name: orientation_name,
        edge_thickness: edge_thickness,
        remap_edge_props: remap_edge_props,
        openings_on_room: openings_on_room,
        guess_temperature: guess_temperature,
        analyse: analyse,
        default_plan: default_plan,
        example_plan: example_plan,
        new_room: new_room,
        rect: rect,
        library: library
    };
})();

if (typeof module!=='undefined') module.exports = floorplan_model;
