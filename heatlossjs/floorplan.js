// =========================================
// HeatLoss.js floor plan builder
// Requires: vue 2, ecodan.js, calc.js, floorplan_model.js
// =========================================
var M = floorplan_model;
var STORAGE_KEY = "heatlossjs_floorplan";

// calculate() in calc.js works on this global
var config = {};

var ICONS = {
    select: "M6 3l12 9-5.5 1 3 6-2.5 1.2-3-6L6 18z",
    room: "M4 4h16v16H4z M4 12h7 M11 12v8",
    window: "M3 9h18v6H3z M3 12h18",
    door: "M4 20V5 M4 5a15 15 0 0 1 15 15 M2 20h20",
    undo: "M9 14L4 9l5-5 M4 9h11a5 5 0 0 1 0 10h-3",
    redo: "M15 14l5-5-5-5 M20 9H9a5 5 0 0 0 0 10h3",
    split: "M9 6a3 3 0 1 1-6 0a3 3 0 1 1 6 0 M9 18a3 3 0 1 1-6 0a3 3 0 1 1 6 0 M20 4L8.1 15.9 M14.5 14.5L20 20 M8.1 8.1L12 12",
    play: "M7 4.5l12 7.5-12 7.5z",
    pause: "M8 5v14 M16 5v14"
};

function load_saved_plan() {
    try {
        var s = localStorage.getItem(STORAGE_KEY);
        if (s) return JSON.parse(s);
    } catch (e) {}
    return null;
}

// Fill in anything missing from older or hand edited plans
function normalize_plan(plan) {
    var d = M.default_plan();
    for (var z in d) if (plan[z]===undefined) plan[z] = d[z];
    for (var z in d.defaults) if (plan.defaults[z]===undefined) plan.defaults[z] = d.defaults[z];
    var max_id = 0;
    function track(id) { var n = parseInt(String(id).replace(/\D/g,"")); if (n>max_id) max_id = n; }
    plan.levels.forEach(function(l) { track(l.id); });
    plan.rooms.forEach(function(r) {
        track(r.id);
        if (r.heated===undefined) r.heated = true;
        if (r.temperature===undefined) r.temperature = 20;
        if (r.ach===undefined) r.ach = plan.default_ach;
        if (r.height===undefined) r.height = null;
        if (!r.edges || Array.isArray(r.edges)) r.edges = {};
        if (r.floor===undefined) r.floor = null;
        if (r.ceiling===undefined) r.ceiling = null;
        if (!r.extra) r.extra = [];
        if (!r.radiators) r.radiators = [];
        if (!r.ufh) r.ufh = [];
    });
    plan.openings.forEach(function(op) { track(op.id); });
    if (!(plan.next_id>max_id)) plan.next_id = max_id+1;
    return plan;
}

function download_data(filename, data) {
    var blob = new Blob([data], {type: 'application/json'});
    var elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}

function dist_to_segment(px, py, x1, y1, x2, y2) {
    var dx = x2-x1, dy = y2-y1, l2 = dx*dx+dy*dy;
    var t = l2>0 ? Math.max(0, Math.min(1, ((px-x1)*dx+(py-y1)*dy)/l2)) : 0;
    var cx = x1+t*dx, cy = y1+t*dy;
    return Math.sqrt((px-cx)*(px-cx)+(py-cy)*(py-cy));
}

// Scissors cursor for the split tool, white outline so it shows on any fill
var SPLIT_CURSOR = 'url("data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-linecap="round">' +
    '<path d="'+ICONS.split+'" stroke="#fff" stroke-width="4"/><path d="'+ICONS.split+'" stroke="#1f2933" stroke-width="1.8"/></svg>') +
    '") 12 12, crosshair';

var saved_plan = load_saved_plan();
var first_visit = !saved_plan;

var app = new Vue({
    el: '#floorplan',
    template: '#floorplan-template',

    data: {
        plan: normalize_plan(saved_plan || M.example_plan()),
        level_id: null,
        tool: 'select',
        sel: null,
        multi: [],
        view: { scale: 50, ox: 180, oy: 70 },
        size: { w: 800, h: 600 },
        drag: null,
        hover: null,
        draft: null,
        ghost: null,
        split_ghost: null,
        guides: [],
        calc: null,
        tab: 'details',
        show_heat: true,
        solver: { running: false, steps: 0, balanced: false },
        show_intro: first_visit,
        dim_edit: null,
        history: [],
        history_index: -1,
        space_down: false,
        last_size: { window: {width:1.2, height:1.2}, door: {width:0.9, height:2.0} },
        new_boundary: { name: "", temperature: 10 },
        lib_choice: "",
        library: M.library,
        icons: ICONS,
        tools: [
            { id:'select', label:'Select', key:'V', title:'Select, move and resize (V)' },
            { id:'room', label:'Room', key:'R', title:'Drag to draw a room (R)' },
            { id:'window', label:'Window', key:'W', title:'Click on a wall to add a window (W)' },
            { id:'door', label:'Door', key:'D', title:'Click on a wall to add a door (D)' },
            { id:'split', label:'Split', key:'S', title:'Click on a wall to split it, then drag either part to make a step (S)' }
        ]
    },

    computed: {
        level: function() {
            var id = this.level_id;
            return this.plan.levels.filter(function(l){ return l.id==id; })[0] || this.plan.levels[0];
        },
        level_index: function() {
            return this.plan.levels.indexOf(this.level);
        },
        level_rooms: function() {
            var id = this.level.id;
            return this.plan.rooms.filter(function(r){ return r.level==id; });
        },
        ghost_rooms: function() {
            if (this.level_index<1) return [];
            var id = this.plan.levels[this.level_index-1].id;
            return this.plan.rooms.filter(function(r){ return r.level==id; });
        },
        level_openings: function() {
            var id = this.level.id;
            return this.plan.openings.filter(function(op){ return op.level==id; });
        },
        analysis: function() {
            return M.analyse(this.plan);
        },
        level_walls: function() {
            // walls of unheated spaces first so heated room walls draw on top
            var id = this.level.id;
            var list = this.analysis.walls.filter(function(w){ return w.level==id; });
            return list.filter(function(w){ return w.kind.indexOf('unheated_')==0; })
                .concat(list.filter(function(w){ return w.kind.indexOf('unheated_')!=0; }));
        },
        // Wall footprints, shared walls appear once from each side which does no harm
        level_bands: function() {
            return this.level_walls.filter(function(w){ return w.band; });
        },
        ghost_bands: function() {
            if (this.level_index<1) return [];
            var id = this.plan.levels[this.level_index-1].id;
            return this.analysis.walls.filter(function(w){ return w.level==id && w.band; });
        },
        level_opening_shapes: function() {
            var self = this;
            return this.level_openings.map(function(op){ return { op: op, rect: self.opening_rect(op), jambs: self.opening_jambs(op), lines: self.opening_lines(op) }; })
                .filter(function(o){ return o.rect; });
        },
        // Windows and doors not in a wall with thickness, drawn as a line instead
        level_loose_openings: function() {
            var shaped = this.level_opening_shapes.map(function(o){ return o.op; });
            return this.level_openings.filter(function(op){ return shaped.indexOf(op)==-1; });
        },
        selected_room: function() {
            if (!this.sel || this.sel.kind!='room') return null;
            return this.room_by_id(this.sel.id);
        },
        selected_opening: function() {
            if (!this.sel || this.sel.kind!='opening') return null;
            var id = this.sel.id;
            return this.plan.openings.filter(function(op){ return op.id==id; })[0] || null;
        },
        selected_wall: function() {
            var s = this.sel;
            if (!s || s.kind!='wall') return null;
            var list = this.analysis.walls.filter(function(w){ return w.room==s.room && w.edge==s.edge; });
            var hit = list.filter(function(w) {
                var t = M.along(w, s.x, s.y);
                return t>=w.lo-0.001 && t<=w.hi+0.001;
            })[0];
            return hit || list[0] || null;
        },
        multi_rooms: function() {
            var self = this;
            return this.multi.map(function(id){ return self.room_by_id(id); }).filter(Boolean);
        },
        room_dims: function() {
            var r = this.selected_room;
            if (!r || this.drag) return [];
            var self = this;
            return M.edges(r.points).filter(function(e){ return e.len>M.EPS; }).map(function(e) {
                var mx = (e.x1+e.x2)/2, my = (e.y1+e.y2)/2;
                var text = e.len.toFixed(2)+" m";
                return {
                    edge: e.i, len: e.len, text: text,
                    x: self.sx(mx)+e.nx*16, y: self.sy(my)+e.ny*16,
                    w: text.length*6.6+10
                };
            });
        },
        grid: function() {
            var s = this.view.scale, w = this.size.w, h = this.size.h;
            var x0 = -this.view.ox/s, x1 = (w-this.view.ox)/s;
            var y0 = -this.view.oy/s, y1 = (h-this.view.oy)/s;
            var major = "", minor = "";
            var step = this.plan.grid>0 ? this.plan.grid : 0.1;
            while (step*s<10) step *= 5;
            var major_step = 1;
            while (major_step*s<40) major_step *= 5;
            var x, y, sx;
            for (x=Math.floor(x0/step)*step; x<=x1; x+=step) {
                sx = Math.round(this.sx(x))+0.5;
                if (Math.abs(x/major_step-Math.round(x/major_step))<1e-6) major += "M"+sx+" 0V"+h;
                else minor += "M"+sx+" 0V"+h;
            }
            for (y=Math.floor(y0/step)*step; y<=y1; y+=step) {
                sx = Math.round(this.sy(y))+0.5;
                if (Math.abs(y/major_step-Math.round(y/major_step))<1e-6) major += "M0 "+sx+"H"+w;
                else minor += "M0 "+sx+"H"+w;
            }
            return { major: major, minor: minor };
        },
        scale_bar: function() {
            var options = [0.5,1,2,5,10,20,50];
            var s = this.view.scale;
            var m = options.filter(function(o){ return o*s>=60; })[0] || 50;
            return { m: m, px: m*s };
        },
        cursor: function() {
            if (this.drag && this.drag.type=='pan') return 'grabbing';
            if (this.space_down) return 'grab';
            if (this.tool=='room') return 'crosshair';
            if (this.tool=='split') return SPLIT_CURSOR;
            if (this.tool=='window' || this.tool=='door') return this.ghost ? 'copy' : 'not-allowed';
            var h = this.hover;
            if (!h) return 'default';
            if (h.kind=='vertex') return 'move';
            if (h.kind=='edge') return h.axis=='h' ? 'ns-resize' : (h.axis=='v' ? 'ew-resize' : 'move');
            if (h.kind=='opening') return 'grab';
            if (h.kind=='room') return 'move';
            return 'default';
        },
        // Circle on the corner or split point under the pointer, or being dragged
        vertex_marker: function() {
            var d = this.drag;
            if (d && d.type=='vertex') {
                var q = d.room.points[d.index];
                return q ? { x: q[0], y: q[1] } : null;
            }
            var h = this.hover;
            if (!d && this.tool=='select' && h && h.kind=='vertex') return { x: h.x, y: h.y };
            return null;
        },
        hover_room: function() {
            return this.hover && this.hover.kind=='room' ? this.hover.room.id : null;
        },
        element_type_names: function() {
            return Object.keys(this.plan.element_type);
        },
        boundary_names: function() {
            return Object.keys(this.plan.T);
        },
        heated_rooms: function() {
            return this.plan.rooms.filter(function(r){ return r.heated; });
        },
        has_radiators: function() {
            return this.plan.rooms.some(function(r){ return r.radiators.length || r.ufh.length; });
        },
        max_wm2: function() {
            return 100;
        }
    },

    watch: {
        analysis: function() {
            // the plan changed under the solver, start again from the new plan
            if (this.solver.running) this.stop_solver(false);
            if (!this.drag) this.schedule_calc();
        }
    },

    mounted: function() {
        var self = this;
        this.level_id = this.plan.levels[0].id;
        this.resize();
        if (window.ResizeObserver) {
            new ResizeObserver(function(){ self.resize(); }).observe(this.$refs.canvas);
        }
        window.addEventListener('resize', this.resize);
        window.addEventListener('keydown', this.on_key);
        window.addEventListener('keyup', function(e) {
            if (e.code=='Space') self.space_down = false;
        });
        this.reset_history();
        this.$nextTick(function() {
            self.fit();
            self.run_calc();
        });
    },

    methods: {
        // ------------------------------------------------------------------
        // Coordinates
        // ------------------------------------------------------------------
        sx: function(x) { return this.view.ox + x*this.view.scale; },
        sy: function(y) { return this.view.oy + y*this.view.scale; },
        poly: function(pts) {
            var self = this;
            return pts.map(function(p){ return self.sx(p[0]).toFixed(1)+","+self.sy(p[1]).toFixed(1); }).join(" ");
        },
        world: function(e) {
            var rect = this.$refs.svg.getBoundingClientRect();
            return {
                x: (e.clientX-rect.left-this.view.ox)/this.view.scale,
                y: (e.clientY-rect.top-this.view.oy)/this.view.scale,
                px: e.clientX-rect.left,
                py: e.clientY-rect.top
            };
        },
        resize: function() {
            var el = this.$refs.canvas;
            if (!el) return;
            this.size.w = el.clientWidth;
            this.size.h = el.clientHeight;
        },
        fit: function() {
            var rooms = this.level_rooms.length ? this.level_rooms : this.plan.rooms;
            if (!rooms.length) {
                // keep the origin clear of the floor buttons
                this.view.scale = 50;
                this.view.ox = 180;
                this.view.oy = 70;
                return;
            }
            var pts = [];
            rooms.forEach(function(r){ pts = pts.concat(r.points); });
            this.level_bands.forEach(function(w){ pts = pts.concat(w.band); });
            var b = M.bbox(pts);
            var w = Math.max(b.x2-b.x1, 1), h = Math.max(b.y2-b.y1, 1);
            var s = Math.min((this.size.w-120)/w, (this.size.h-170)/h);
            s = Math.max(10, Math.min(200, s));
            this.view.scale = s;
            this.view.ox = (this.size.w - w*s)/2 - b.x1*s;
            this.view.oy = (this.size.h - h*s)/2 - b.y1*s + 10;
        },
        zoom: function(factor, px, py) {
            if (px===undefined) { px = this.size.w/2; py = this.size.h/2; }
            var s = Math.max(8, Math.min(400, this.view.scale*factor));
            var wx = (px-this.view.ox)/this.view.scale, wy = (py-this.view.oy)/this.view.scale;
            this.view.scale = s;
            this.view.ox = px - wx*s;
            this.view.oy = py - wy*s;
        },

        // ------------------------------------------------------------------
        // Lookups
        // ------------------------------------------------------------------
        room_by_id: function(id) {
            return this.plan.rooms.filter(function(r){ return r.id==id; })[0] || null;
        },
        room_name: function(id) {
            var r = this.room_by_id(id);
            return r ? r.name : "";
        },
        room_calc: function(r) {
            if (!this.calc || !r || !r.heated) return null;
            return this.calc.rooms[this.analysis.names[r.id]] || null;
        },
        room_area: function(r) {
            return M.area(r.points);
        },
        room_height: function(r) {
            if (r.height>0) return r.height;
            var l = this.plan.levels.filter(function(l){ return l.id==r.level; })[0];
            return l ? l.height : 2.4;
        },
        is_rectangle: function(r) {
            return r.points.length==4 && M.is_orthogonal(r.points);
        },
        level_name: function(id) {
            var l = this.plan.levels.filter(function(l){ return l.id==id; })[0];
            return l ? l.name : "";
        },

        // ------------------------------------------------------------------
        // Calculation
        // ------------------------------------------------------------------
        schedule_calc: function() {
            var self = this;
            clearTimeout(this.calc_timer);
            this.calc_timer = setTimeout(function(){ self.run_calc(); }, 150);
        },
        run_calc: function() {
            var cfg = M.clone(this.analysis.config);
            config = cfg;
            try {
                calculate();
                this.calc = Object.freeze(cfg);
            } catch (e) {
                console.error(e);
            }
        },

        // ------------------------------------------------------------------
        // Solve room temperatures
        //
        // Each step moves every room's temperature by the difference between
        // its emitter output and heat loss (as in the table view), so rooms
        // without radiators settle at the temperature their neighbours keep them at
        // ------------------------------------------------------------------
        toggle_solver: function() {
            if (this.solver.running) this.stop_solver(true);
            else this.start_solver();
        },
        start_solver: function() {
            clearTimeout(this.calc_timer);
            clearTimeout(this.solver_timer);
            this.solver_config = M.clone(this.analysis.config);
            this.solver.running = true;
            this.solver.balanced = false;
            this.solver.steps = 0;
            var self = this;
            requestAnimationFrame(function(){ self.solver_frame(); });
        },
        solver_frame: function() {
            if (!this.solver.running) return;
            var cfg = this.solver_config, change = 0;
            config = cfg;
            for (var i=0; i<2; i++) {
                calculate();
                for (var z in cfg.rooms) {
                    var t = cfg.rooms[z].energy / cfg.JK;
                    change = Math.max(change, Math.abs(t-cfg.rooms[z].temperature));
                    cfg.rooms[z].temperature = t;
                }
                this.solver.steps++;
            }
            this.calc = Object.freeze(M.clone(cfg));
            if (change<0.0005 || this.solver.steps>=5000) {
                this.solver.balanced = change<0.0005;
                this.stop_solver(true);
                return;
            }
            var self = this;
            requestAnimationFrame(function(){ self.solver_frame(); });
        },
        // Stopping keeps the temperatures reached so far, undo puts the old ones back
        stop_solver: function(keep) {
            this.solver.running = false;
            var cfg = this.solver_config;
            this.solver_config = null;
            var self = this;
            clearTimeout(this.solver_timer);
            this.solver_timer = setTimeout(function(){ self.solver.balanced = false; self.solver.steps = 0; }, keep ? 5000 : 0);
            if (!keep || !cfg) return;
            var names = this.analysis.names;
            this.plan.rooms.forEach(function(r) {
                var cr = cfg.rooms[names[r.id]];
                if (!r.heated || !cr) return;
                r.temperature = M.round(cr.temperature, 2);
                r.temp_auto = false;
            });
            this.commit();
        },

        // ------------------------------------------------------------------
        // Display helpers
        // ------------------------------------------------------------------
        fmt: function(v, dp) {
            if (v===undefined || v===null || isNaN(v)) return "-";
            dp = dp || 0;
            return Number(v).toLocaleString(undefined, {minimumFractionDigits: dp, maximumFractionDigits: dp});
        },
        heat_colour: function(wm2) {
            var stops = [[0,[255,250,235]],[0.35,[255,214,140]],[0.7,[245,140,80]],[1,[214,64,52]]];
            var t = Math.max(0, Math.min(1, wm2/this.max_wm2));
            for (var i=1; i<stops.length; i++) {
                if (t<=stops[i][0]) {
                    var a = stops[i-1], b = stops[i], f = (t-a[0])/(b[0]-a[0]);
                    var c = a[1].map(function(v,k){ return Math.round(v+(b[1][k]-v)*f); });
                    return "rgb("+c.join(",")+")";
                }
            }
            return "rgb(214,64,52)";
        },
        room_fill: function(r) {
            if (!r.heated) return "url(#fp-hatch)";
            var rc = this.room_calc(r);
            if (this.show_heat && rc && rc.area>0) return this.heat_colour(rc.heat/rc.area);
            return "var(--room)";
        },
        room_label: function(r) {
            var c = M.centroid(r.points);
            var w = M.bbox(r.points);
            var width_px = (w.x2-w.x1)*this.view.scale, height_px = (w.y2-w.y1)*this.view.scale;
            var lines = [{text: r.name, cls: 'name'}];
            var rc = this.room_calc(r);
            if (!r.heated) {
                lines.push({text: "unheated", cls: 'sub'});
            } else if (rc) {
                lines.push({text: this.fmt(rc.heat)+" W", cls: 'watts'});
                if (height_px>70) lines.push({text: this.fmt(rc.temperature,1)+"°C · "+this.fmt(rc.area,1)+" m²", cls: 'sub'});
            }
            if (width_px<60 || height_px<34) lines = lines.slice(0,1);
            var y0 = this.sy(c[1]) - (lines.length-1)*8;
            return { x: this.sx(c[0]), y: y0, lines: lines, small: width_px<90 };
        },
        wall_class: function(w) {
            if (w.kind=='external') return w.boundary=='external' ? 'external' : 'boundary';
            return w.kind;
        },
        // The wall a window or door sits in, preferring the heated side
        opening_host: function(op) {
            var best = null;
            this.level_walls.forEach(function(w) {
                if (!w.band) return;
                var t = M.opening_along(op, w, w.dist);
                if (t===null || t<w.lo-0.001 || t>w.hi+0.001) return;
                if (!best || (best.item===null && w.item!==null)) best = w;
            });
            return best;
        },
        // Window or door drawn through the full thickness of its wall
        opening_rect: function(op) {
            var w = this.opening_host(op);
            if (!w) return null;
            var t = M.along(w, op.x, op.y), h = op.width/2;
            return [M.line_point(w, t-h), M.line_point(w, t+h), M.line_point(w, t+h, w.thick), M.line_point(w, t-h, w.thick)];
        },
        // Faint double line down the middle of a window or door in an outside wall,
        // left out when the wall is drawn too thin for it to read
        opening_lines: function(op) {
            var w = this.opening_host(op);
            if (!w || w.other || w.thick*this.view.scale<12) return [];
            var t = M.along(w, op.x, op.y), h = op.width/2, self = this;
            var gap = 1.5/this.view.scale;
            return [w.thick/2-gap, w.thick/2+gap].map(function(d) {
                var a = M.line_point(w, t-h, d), b = M.line_point(w, t+h, d);
                return { x1: self.sx(a[0]), y1: self.sy(a[1]), x2: self.sx(b[0]), y2: self.sy(b[1]) };
            });
        },
        // Lines across the wall at each end of a window or door, its only outline so the
        // cut-out sits flush with the faces of the wall
        opening_jambs: function(op) {
            var r = this.opening_rect(op), self = this;
            if (!r) return [];
            return [[r[0],r[3]], [r[1],r[2]]].map(function(l) {
                return { x1: self.sx(l[0][0]), y1: self.sy(l[0][1]), x2: self.sx(l[1][0]), y2: self.sy(l[1][1]) };
            });
        },
        opening_line: function(op) {
            var d = M.opening_dir(op), h = op.width/2;
            return { x1: this.sx(op.x-d[0]*h), y1: this.sy(op.y-d[1]*h), x2: this.sx(op.x+d[0]*h), y2: this.sy(op.y+d[1]*h) };
        },
        wall_label: function(w) {
            if (!w) return "";
            if (w.kind=='internal') return "Internal wall";
            if (w.kind=='unheated') return "Wall to unheated space";
            if (w.kind=='external') return w.boundary=='external' ? "External wall" : "Wall to "+w.boundary;
            if (w.kind=='junction') return "Wall junction";
            return "Wall of unheated space";
        },
        element_heat: function(room_id, item) {
            var r = this.room_by_id(room_id), rc = this.room_calc(r);
            if (!rc) return null;
            for (var i=0; i<rc.elements.length; i++) {
                var e = rc.elements[i];
                if (e && e.id==item) return { heat: e.heat, A: this.calc.elements[item].A, u: this.calc.elements[item].uvalue };
            }
            return null;
        },
        breakdown: function(r) {
            var rc = this.room_calc(r);
            if (!rc) return [];
            var calc = this.calc;
            var rows = rc.elements.filter(function(e){ return e!==false; }).map(function(e) {
                var el = calc.elements[e.id];
                return { type: el.type, boundary: e.boundary, orientation: el.orientation, A: el.A, u: el.uvalue, heat: e.heat };
            });
            rows.push({ type: "Ventilation", boundary: r.ach+" ACH", orientation: "", A: null, u: null, heat: rc.infiltration_heat });
            return rows;
        },
        room_wm2: function(r) {
            var rc = this.room_calc(r);
            return rc && rc.area>0 ? rc.heat/rc.area : null;
        },

        // ------------------------------------------------------------------
        // History
        // ------------------------------------------------------------------
        reset_history: function() {
            this.history = [JSON.stringify(this.plan)];
            this.history_index = 0;
        },
        commit: function() {
            var s = JSON.stringify(this.plan);
            if (this.history[this.history_index]===s) return;
            this.history = this.history.slice(0, this.history_index+1);
            this.history.push(s);
            if (this.history.length>200) this.history.shift();
            this.history_index = this.history.length-1;
            this.save_local(s);
            this.schedule_calc();
        },
        save_local: function(s) {
            try { localStorage.setItem(STORAGE_KEY, s || JSON.stringify(this.plan)); } catch (e) {}
        },
        restore: function(index) {
            this.history_index = index;
            this.plan = JSON.parse(this.history[index]);
            if (!this.room_by_id(this.sel && this.sel.id) && this.sel && this.sel.kind=='room') this.sel = null;
            if (this.sel && this.sel.kind=='opening' && !this.selected_opening) this.sel = null;
            if (this.sel && this.sel.kind=='wall' && !this.room_by_id(this.sel.room)) this.sel = null;
            if (!this.plan.levels.some(function(l){ return l.id==this.level_id; }, this)) this.level_id = this.plan.levels[0].id;
            this.multi = [];
            this.save_local(this.history[index]);
        },
        undo: function() { if (this.history_index>0) this.restore(this.history_index-1); },
        redo: function() { if (this.history_index<this.history.length-1) this.restore(this.history_index+1); },

        // ------------------------------------------------------------------
        // Snapping
        // ------------------------------------------------------------------
        // Snap step in metres, millimetres when the snap grid is off
        snap_step: function() {
            return this.plan.grid>0 ? 1*this.plan.grid : 0.001;
        },
        snap_candidates: function(exclude) {
            var xs = [], ys = [];
            this.level_rooms.concat(this.ghost_rooms).forEach(function(r) {
                if (exclude && exclude.indexOf(r.id)!=-1) return;
                r.points.forEach(function(p){ xs.push(p[0]); ys.push(p[1]); });
            });
            return { xs: xs, ys: ys };
        },
        snap_value: function(v, cands, axis, free) {
            if (free) return v;
            var tol = 8/this.view.scale, best = null;
            cands.forEach(function(c) {
                if (Math.abs(c-v)<tol && (best===null || Math.abs(c-v)<Math.abs(best-v))) best = c;
            });
            if (best!==null) {
                this.guides.push({ axis: axis, v: best });
                return best;
            }
            var g = this.snap_step();
            return M.round(Math.round(v/g)*g);
        },
        snap_point: function(p, cands, free) {
            return { x: this.snap_value(p.x, cands.xs, 'x', free), y: this.snap_value(p.y, cands.ys, 'y', free) };
        },
        // Snap a whole shape being moved: choose the delta that lines any vertex up
        snap_delta: function(pts, d, cands, axis, free) {
            if (free) return d;
            var k = axis=='x' ? 0 : 1, list = axis=='x' ? cands.xs : cands.ys;
            var tol = 8/this.view.scale, best = null, line = null;
            pts.forEach(function(p) {
                var v = p[k]+d;
                list.forEach(function(c) {
                    if (Math.abs(c-v)<tol && (best===null || Math.abs(c-v)<Math.abs(best))) { best = c-v; line = c; }
                });
            });
            if (best!==null) {
                this.guides.push({ axis: axis, v: line });
                return d+best;
            }
            var g = this.snap_step();
            return M.round(Math.round(d/g)*g);
        },

        // ------------------------------------------------------------------
        // Hit testing
        // ------------------------------------------------------------------
        hit_test: function(p) {
            var tol = 7/this.view.scale;
            // corners and split points of any room, the selected room first
            var rooms = this.level_rooms.slice(), r = this.selected_room;
            if (r && rooms.indexOf(r)!=-1) { rooms.splice(rooms.indexOf(r),1); rooms.unshift(r); }
            var best = null;
            rooms.forEach(function(room) {
                room.points.forEach(function(q, i) {
                    var dx = q[0]-p.x, dy = q[1]-p.y, d = Math.sqrt(dx*dx+dy*dy);
                    if (d<tol*1.3 && (!best || d<best.d-M.EPS)) best = { kind:'vertex', room:room, index:i, x:q[0], y:q[1], d:d };
                });
            });
            if (best) return best;
            var ops = this.level_openings;
            for (var i=ops.length-1; i>=0; i--) {
                var l = this.opening_line(ops[i]);
                var d = dist_to_segment(p.px, p.py, l.x1, l.y1, l.x2, l.y2);
                var b = this.opening_rect(ops[i]);
                if (d<6 || (b && M.point_in_polygon(p.x, p.y, b))) return { kind:'opening', opening:ops[i] };
            }
            var edge_hits = [];
            this.level_rooms.forEach(function(room) {
                M.edges(room.points).forEach(function(e) {
                    if (e.len<M.EPS) return;
                    var d = dist_to_segment(p.x, p.y, e.x1, e.y1, e.x2, e.y2);
                    if (d<tol) edge_hits.push({ kind:'edge', room:room, edge:e.i, axis:e.axis, d:d,
                        inside: M.point_in_polygon(p.x, p.y, room.points) });
                });
            });
            if (edge_hits.length) {
                edge_hits.sort(function(a,b) {
                    if (a.inside!=b.inside) return a.inside ? -1 : 1;
                    return a.d-b.d;
                });
                return edge_hits[0];
            }
            var inside = this.level_rooms.filter(function(room){ return M.point_in_polygon(p.x, p.y, room.points); });
            if (inside.length) {
                inside.sort(function(a,b){ return M.area(a.points)-M.area(b.points); });
                return { kind:'room', room:inside[0] };
            }
            var bands = this.level_bands;
            for (var i=bands.length-1; i>=0; i--) {
                var w = bands[i];
                if (!M.point_in_polygon(p.x, p.y, w.band)) continue;
                return { kind:'edge', room:this.room_by_id(w.room), edge:w.edge, axis:w.axis, wall:w };
            }
            return null;
        },

        // Nearest wall position for a window or door of the given width
        opening_position: function(p, width) {
            var tol = 14/this.view.scale, best = null;
            this.level_rooms.forEach(function(room) {
                M.edges(room.points).forEach(function(e) {
                    if (e.len<M.EPS) return;
                    var d = dist_to_segment(p.x, p.y, e.x1, e.y1, e.x2, e.y2);
                    if (d<tol && (!best || d<best.d)) best = { d:d, e:e, room:room };
                });
            });
            if (!best) return null;
            return this.point_on_edge(best.e, M.along(best.e, p.x, p.y), width);
        },
        // Where a window or door of the given width centred near t sits on an edge or wall
        point_on_edge: function(e, t, width) {
            var g = this.snap_step();
            t = Math.round(t/g)*g;
            var half = width/2;
            if (e.hi-e.lo>width) t = Math.max(e.lo+half, Math.min(e.hi-half, t));
            else t = (e.lo+e.hi)/2;
            var q = M.line_point(e, t);
            var pos = { x: M.round(q[0]), y: M.round(q[1]), axis: e.axis };
            if (e.axis=='h') pos.y = e.c;
            if (e.axis=='v') pos.x = e.c;
            if (e.axis=='d') pos.dir = [e.ax, e.ay];
            return pos;
        },

        // Edges lying on the same wall line, so a shared wall moves as one
        linked_edges: function(room, index) {
            var first = M.edges(room.points)[index];
            var result = [{ room: room, edge: index, e: first }];
            if (first.len<M.EPS) return result;
            var rooms = this.level_rooms;
            var queue = [result[0]];
            while (queue.length) {
                var cur = queue.pop();
                rooms.forEach(function(S) {
                    M.edges(S.points).forEach(function(f) {
                        if (f.len<M.EPS || Math.abs(f.nx+cur.e.nx)>0.001 || Math.abs(f.ny+cur.e.ny)>0.001) return;
                        if (Math.abs(f.k-cur.e.k)>M.EPS) return;
                        if (Math.min(f.hi,cur.e.hi)-Math.max(f.lo,cur.e.lo)<0.01) return;
                        if (result.some(function(x){ return x.room===S && x.edge==f.i; })) return;
                        var item = { room: S, edge: f.i, e: f };
                        result.push(item);
                        queue.push(item);
                    });
                });
            }
            return result;
        },

        // Room edges on both faces of a shared wall, following the wall on to any
        // other rooms it is shared with
        wall_faces: function(wall) {
            var self = this, keys = {}, result = [];
            function add(room_id, edge) {
                var k = room_id+":"+edge;
                if (keys[k]) return false;
                keys[k] = true;
                self.linked_edges(self.room_by_id(room_id), edge).forEach(function(l) {
                    keys[l.room.id+":"+l.edge] = true;
                    if (!result.some(function(x){ return x.room===l.room && x.edge==l.edge; })) result.push(l);
                });
                return true;
            }
            add(wall.room, wall.edge);
            add(wall.other, wall.other_edge);
            var walls = this.level_walls.filter(function(w){ return w.other; });
            var changed = true;
            while (changed) {
                changed = false;
                walls.forEach(function(w) {
                    var a = keys[w.room+":"+w.edge], b = keys[w.other+":"+w.other_edge];
                    if (a && !b) changed = add(w.other, w.other_edge) || changed;
                    if (b && !a) changed = add(w.room, w.edge) || changed;
                });
            }
            return result;
        },

        // ------------------------------------------------------------------
        // Pointer events
        // ------------------------------------------------------------------
        begin_shape_drag: function(type, rooms, p, extra) {
            var self = this;
            var d = {
                type: type, start: p, moved: false,
                origs: {}, ops: [], op_orig: {},
                cands: this.snap_candidates(rooms.map(function(r){ return r.id; }))
            };
            var seen = {};
            rooms.forEach(function(r) {
                d.origs[r.id] = M.clone(r.points);
                M.openings_on_room(self.plan, r).forEach(function(o) {
                    if (seen[o.opening.id]) return;
                    seen[o.opening.id] = true;
                    d.ops.push({ op: o.opening, room: r, edge: o.edge, dist: o.dist });
                    d.op_orig[o.opening.id] = { x: o.opening.x, y: o.opening.y, axis: o.opening.axis, dir: o.opening.dir };
                });
            });
            for (var z in extra) d[z] = extra[z];
            return d;
        },

        on_down: function(e) {
            // pointerdown is prevented so focus stays put, blur so any edited field commits
            var active = document.activeElement;
            if (active && active!==document.body && active.blur) active.blur();
            if (this.dim_edit) this.apply_dim();
            var p = this.world(e);
            try { this.$refs.svg.setPointerCapture(e.pointerId); } catch (err) {}
            this.guides = [];

            if (e.button==1 || e.button==2 || this.space_down) {
                this.drag = { type:'pan', start:p, ox:this.view.ox, oy:this.view.oy, moved:true };
                return;
            }

            if (this.tool=='room') {
                var s = this.snap_point(p, this.snap_candidates(), e.altKey);
                this.draft = { x1:s.x, y1:s.y, x2:s.x, y2:s.y };
                this.drag = { type:'draw', start:p, moved:false, cands:this.snap_candidates() };
                return;
            }

            if (this.tool=='split') {
                var sp = this.split_position(p);
                if (sp) this.split_edge(sp.room, sp.edge, sp.x, sp.y);
                this.split_ghost = this.split_position(p);
                return;
            }

            if (this.tool=='window' || this.tool=='door') {
                var pos = this.opening_position(p, this.last_size[this.tool].width);
                if (!pos) return;
                var op = {
                    id: "o"+(this.plan.next_id++), level: this.level.id, kind: this.tool,
                    x: pos.x, y: pos.y, axis: pos.axis,
                    width: this.last_size[this.tool].width, height: this.last_size[this.tool].height,
                    type: null
                };
                if (pos.dir) op.dir = pos.dir;
                this.plan.openings.push(op);
                this.select({ kind:'opening', id:op.id });
                this.commit();
                return;
            }

            var h = this.hit_test(p);
            if (!h) {
                this.drag = { type:'pan', start:p, ox:this.view.ox, oy:this.view.oy, moved:false, clear:true };
                return;
            }
            if (h.kind=='vertex') {
                // corners in the same place (a split point, or rooms that share a corner) move together
                var targets = this.vertex_targets(h, e.altKey);
                this.drag = this.begin_shape_drag('vertex', targets.map(function(t){ return t.room; }), p,
                    { room:h.room, index:h.index, vx:h.x, vy:h.y, targets:targets });
                // line up with the room's other corners as well, so walls snap back square
                var cands = this.drag.cands;
                targets.forEach(function(t) {
                    t.room.points.forEach(function(q, i) {
                        if (t.indices.indexOf(i)==-1) { cands.xs.push(q[0]); cands.ys.push(q[1]); }
                    });
                });
            } else if (h.kind=='opening') {
                this.select({ kind:'opening', id:h.opening.id });
                this.drag = { type:'opening', op:h.opening, start:p, moved:false };
            } else if (h.kind=='edge') {
                var linked = e.altKey ? [{ room:h.room, edge:h.edge, e:M.edges(h.room.points)[h.edge] }] : this.linked_edges(h.room, h.edge);
                // Grabbing the middle of a wall between rooms moves every room face along it
                if (h.wall && h.wall.other && !e.altKey) linked = this.wall_faces(h.wall);
                var rooms = [];
                linked.forEach(function(l){ if (rooms.indexOf(l.room)==-1) rooms.push(l.room); });
                this.drag = this.begin_shape_drag('edge', rooms, p, { room:h.room, edge:h.edge, axis:h.axis, linked:linked });
            } else if (h.kind=='room') {
                if (e.shiftKey) {
                    this.toggle_multi(h.room);
                    return;
                }
                if (!this.selected_room || this.selected_room.id!=h.room.id) this.select({ kind:'room', id:h.room.id });
                this.drag = this.begin_shape_drag('move', [h.room], p, { room:h.room });
            }
        },

        on_move: function(e) {
            var p = this.world(e);
            var d = this.drag;
            if (!d) {
                if (this.tool=='select') {
                    var h = this.hit_test(p);
                    this.hover = h;
                } else if (this.tool=='window' || this.tool=='door') {
                    var pos = this.opening_position(p, this.last_size[this.tool].width);
                    this.ghost = pos ? { kind:this.tool, x:pos.x, y:pos.y, axis:pos.axis, dir:pos.dir, width:this.last_size[this.tool].width } : null;
                } else if (this.tool=='split') {
                    this.split_ghost = this.split_position(p);
                } else {
                    this.hover = null;
                }
                return;
            }
            if (!d.moved) {
                var dpx = p.px-d.start.px, dpy = p.py-d.start.py;
                if (Math.sqrt(dpx*dpx+dpy*dpy)<4) return;
                d.moved = true;
            }
            this.guides = [];
            var free = e.altKey;
            var self = this;

            if (d.type=='pan') {
                this.view.ox = d.ox + (p.px-d.start.px);
                this.view.oy = d.oy + (p.py-d.start.py);
            }
            else if (d.type=='north') {
                var cx = this.size.w-44, cy = 44;
                var a = Math.atan2(p.px-cx, -(p.py-cy))*180/Math.PI;
                var step = e.shiftKey ? 1 : 15;
                this.plan.north = ((Math.round(a/step)*step)%360+360)%360;
            }
            else if (d.type=='draw') {
                var s = this.snap_point(p, d.cands, free);
                this.draft.x2 = s.x;
                this.draft.y2 = s.y;
            }
            else if (d.type=='move') {
                var orig = d.origs[d.room.id];
                var dx = this.snap_delta(orig, p.x-d.start.x, d.cands, 'x', free);
                var dy = this.snap_delta(orig, p.y-d.start.y, d.cands, 'y', free);
                d.room.points = orig.map(function(q){ return [M.round(q[0]+dx), M.round(q[1]+dy)]; });
                this.update_dragged_openings(d);
            }
            else if (d.type=='edge') {
                if (d.axis=='d') {
                    // angled walls move square to themselves
                    var e0 = M.edges(d.origs[d.room.id])[d.edge];
                    var g = this.snap_step();
                    var dist = (p.x-d.start.x)*e0.nx + (p.y-d.start.y)*e0.ny;
                    if (!free) dist = Math.round(dist/g)*g;
                    this.apply_edge_shift(d, e0.nx*dist, e0.ny*dist);
                    return;
                }
                var first = M.edges(d.origs[d.room.id])[d.edge];
                var raw = first.c + (d.axis=='h' ? p.y-d.start.y : p.x-d.start.x);
                var c = this.snap_value(raw, d.axis=='h' ? d.cands.ys : d.cands.xs, d.axis=='h' ? 'y' : 'x', free);
                this.apply_edge_coordinate(d, c);
            }
            else if (d.type=='vertex') {
                var s = this.snap_point({ x: d.vx+p.x-d.start.x, y: d.vy+p.y-d.start.y }, d.cands, free);
                d.targets.forEach(function(t) {
                    t.room.points = self.move_vertex(d.origs[t.room.id], t.indices, s.x, s.y, e.shiftKey);
                });
                this.update_dragged_openings(d);
            }
            else if (d.type=='opening') {
                var pos = this.opening_position(p, d.op.width);
                if (pos) this.place_opening(d.op, pos);
            }
        },

        on_up: function(e) {
            var d = this.drag;
            if (!d) return;
            this.drag = null;
            this.guides = [];

            if (d.type=='draw') {
                var r = this.draft;
                this.draft = null;
                var w = Math.abs(r.x2-r.x1), h = Math.abs(r.y2-r.y1);
                if (!d.moved || w<0.3 || h<0.3) return;
                this.add_room(M.rect(Math.min(r.x1,r.x2), Math.min(r.y1,r.y2), Math.max(r.x1,r.x2), Math.max(r.y1,r.y2)));
                return;
            }

            if (!d.moved) {
                if (d.type=='pan' && d.clear) { this.sel = null; this.multi = []; }
                if (d.type=='edge') {
                    var p = this.world(e);
                    this.select({ kind:'wall', room:d.room.id, edge:d.edge, x:p.x, y:p.y });
                }
                if (d.type=='move' || d.type=='vertex') this.multi = [];
                return;
            }

            if (d.type=='pan') return;
            if (d.type=='north' || d.type=='opening') {
                this.commit();
                return;
            }

            // Tidy up the shapes that were edited, undo the edit if a room collapsed
            var self = this, ok = true, rooms = [];
            for (var id in d.origs) rooms.push(this.room_by_id(id));
            var cleaned = rooms.map(function(r) {
                var pts = M.clean_polygon(r.points);
                if (pts.length<3 || M.area(pts)<0.05 || !M.is_simple(pts)) ok = false;
                return pts;
            });
            if (!ok) {
                rooms.forEach(function(r){ r.points = d.origs[r.id]; });
                d.ops.forEach(function(o){ self.restore_opening(o.op, d.op_orig[o.op.id]); });
                return;
            }
            rooms.forEach(function(r, i){ self.set_room_points(r, cleaned[i]); });
            this.commit();
        },

        // Replace a room outline with a tidied version of itself. Wall settings stay with
        // their wall, by position in the outline when no corners were removed.
        set_room_points: function(r, cleaned) {
            var same = cleaned.length==r.points.length && cleaned.every(function(q,i) {
                return Math.abs(q[0]-r.points[i][0])<0.001 && Math.abs(q[1]-r.points[i][1])<0.001;
            });
            if (!same) r.edges = M.remap_edge_props([{ points: r.points, edges: r.edges }], cleaned);
            r.points = cleaned;
        },

        on_wheel: function(e) {
            var p = this.world(e);
            if (e.ctrlKey || Math.abs(e.deltaY)>=Math.abs(e.deltaX)) {
                this.zoom(Math.exp(-e.deltaY*(e.deltaMode==1 ? 0.05 : 0.0015)), p.px, p.py);
            } else {
                this.view.ox -= e.deltaX;
            }
        },

        start_north: function(e) {
            try { this.$refs.svg.setPointerCapture(e.pointerId); } catch (err) {}
            this.drag = { type:'north', start:this.world(e), moved:true };
        },

        // Keep each window and door at the same distance along its wall, turning
        // with the wall if it is now at a different angle
        update_dragged_openings: function(d) {
            var self = this;
            d.ops.forEach(function(o) {
                var e = M.edges(o.room.points)[o.edge];
                if (!e || e.len<M.EPS) return;
                var dist = Math.max(0, Math.min(e.len, o.dist));
                var pos = { x: M.round(e.x1+e.ux*dist), y: M.round(e.y1+e.uy*dist), axis: e.axis };
                if (e.axis=='h') pos.y = e.c;
                if (e.axis=='v') pos.x = e.c;
                if (e.axis=='d') pos.dir = [e.ax, e.ay];
                self.place_opening(o.op, pos);
            });
        },
        place_opening: function(op, pos) {
            op.x = pos.x;
            op.y = pos.y;
            op.axis = pos.axis;
            if (pos.dir) this.$set(op, 'dir', pos.dir);
            else if (op.dir) this.$delete(op, 'dir');
        },
        restore_opening: function(op, orig) {
            this.place_opening(op, orig);
        },

        // Move the dragged edge to c, and the edges linked to it by the same amount
        apply_edge_coordinate: function(d, c) {
            var delta = c - M.edges(d.origs[d.room.id])[d.edge].c;
            if (d.axis=='h') this.apply_edge_shift(d, 0, delta);
            else this.apply_edge_shift(d, delta, 0);
        },
        apply_edge_shift: function(d, dx, dy) {
            d.linked.forEach(function(l) {
                var pts = (l.room.id in d.origs) ? M.clone(l.room.points) : null;
                if (!pts) return;
                var n = pts.length, i = l.edge, j = (l.edge+1)%n;
                pts[i] = [M.round(l.e.x1+dx), M.round(l.e.y1+dy)];
                pts[j] = [M.round(l.e.x2+dx), M.round(l.e.y2+dy)];
                l.room.points = pts;
            });
            this.update_dragged_openings(d);
        },

        // Corners at the same place as a vertex: in this room only, or in every room on the floor
        vertex_targets: function(h, only_this) {
            var rooms = only_this ? [h.room] : this.level_rooms, targets = [];
            rooms.forEach(function(r) {
                var indices = [];
                r.points.forEach(function(q, i) {
                    if (Math.abs(q[0]-h.x)<M.EPS && Math.abs(q[1]-h.y)<M.EPS) indices.push(i);
                });
                if (indices.length) targets.push({ room: r, indices: indices });
            });
            return targets;
        },

        // Move a corner (or the points of a split, which sit together) anywhere, so the
        // walls either side can end up at an angle. Square keeps the walls either side
        // square to the grid by moving the corners next to it as well.
        move_vertex: function(orig, indices, x, y, square) {
            var pts = M.clone(orig), n = pts.length;
            indices.forEach(function(i){ pts[i] = [x, y]; });
            if (!square) return pts;
            var first = indices.filter(function(i){ return indices.indexOf((i+n-1)%n)==-1; })[0];
            var last = indices.filter(function(i){ return indices.indexOf((i+1)%n)==-1; })[0];
            [[(first+n-1)%n, first], [(last+1)%n, last]].forEach(function(pair) {
                var k = pair[0], v = orig[pair[1]];
                if (indices.indexOf(k)!=-1) return;
                if (Math.abs(orig[k][1]-v[1])<M.EPS) pts[k][1] = y;
                else if (Math.abs(orig[k][0]-v[0])<M.EPS) pts[k][0] = x;
            });
            return pts;
        },

        // ------------------------------------------------------------------
        // Dimensions, click a measurement to type an exact length
        // ------------------------------------------------------------------
        edit_dim: function(dim) {
            var self = this;
            this.dim_edit = { room: this.selected_room.id, edge: dim.edge, value: dim.len.toFixed(2), x: dim.x, y: dim.y };
            this.$nextTick(function() {
                var el = self.$refs.dim_input;
                if (el) { el.focus(); el.select(); }
            });
        },
        apply_dim: function() {
            var de = this.dim_edit;
            if (!de) return;
            this.dim_edit = null;
            var v = parseFloat(String(de.value).replace(",", "."));
            var r = this.room_by_id(de.room);
            if (r && v>0.05) this.set_edge_length(r, de.edge, v);
        },
        set_edge_length: function(room, index, length) {
            var pts = room.points, n = pts.length;
            var e = M.edges(pts)[index];
            if (!e || Math.abs(e.len-length)<0.0005) return;
            if (!M.is_orthogonal(pts)) {
                var ux = (e.x2-e.x1)/e.len, uy = (e.y2-e.y1)/e.len;
                var d0 = this.begin_shape_drag('edge', [room], {x:0,y:0});
                var np = M.clone(pts);
                np[(index+1)%n] = [M.round(e.x1+ux*length), M.round(e.y1+uy*length)];
                room.points = np;
                this.update_dragged_openings(d0);
                this.commit();
                return;
            }
            // Lengthening this wall means moving the next wall, along with any walls lined up with it
            var next = (index+1)%n;
            var ne = M.edges(pts)[next];
            var dir = e.axis=='h' ? Math.sign(e.x2-e.x1) : Math.sign(e.y2-e.y1);
            var c = M.round(ne.c + dir*(length-e.len));
            var linked = this.linked_edges(room, next);
            var rooms = [];
            linked.forEach(function(l){ if (rooms.indexOf(l.room)==-1) rooms.push(l.room); });
            var d = this.begin_shape_drag('edge', rooms, {x:0,y:0}, { room:room, edge:next, axis:ne.axis, linked:linked });
            this.apply_edge_coordinate(d, c);
            var ok = true, self = this;
            var cleaned = rooms.map(function(r) {
                var cp = M.clean_polygon(r.points);
                if (cp.length<3 || M.area(cp)<0.05 || !M.is_simple(cp)) ok = false;
                return cp;
            });
            if (!ok) {
                rooms.forEach(function(r){ r.points = d.origs[r.id]; });
                d.ops.forEach(function(o){ self.restore_opening(o.op, d.op_orig[o.op.id]); });
                return;
            }
            rooms.forEach(function(r, i){ self.set_room_points(r, cleaned[i]); });
            this.commit();
        },

        // ------------------------------------------------------------------
        // Keyboard
        // ------------------------------------------------------------------
        on_key: function(e) {
            var tag = (e.target.tagName||"").toLowerCase();
            if (tag=='input' || tag=='select' || tag=='textarea') {
                if (e.key=='Escape' || (e.key=='Enter' && tag=='input' && e.target.type!='file')) e.target.blur();
                return;
            }
            var ctrl = e.ctrlKey || e.metaKey;
            if (ctrl && e.key.toLowerCase()=='z') { e.preventDefault(); if (e.shiftKey) this.redo(); else this.undo(); return; }
            if (ctrl && e.key.toLowerCase()=='y') { e.preventDefault(); this.redo(); return; }
            if (ctrl) return;
            if (e.code=='Space') { this.space_down = true; e.preventDefault(); return; }

            var k = e.key.toLowerCase();
            if (k=='v') this.set_tool('select');
            else if (k=='r') this.set_tool('room');
            else if (k=='w') this.set_tool('window');
            else if (k=='d') this.set_tool('door');
            else if (k=='s') this.set_tool('split');
            else if (k=='f') this.fit();
            else if (k=='+' || k=='=') this.zoom(1.25);
            else if (k=='-') this.zoom(0.8);
            else if (e.key=='Escape') {
                if (this.drag && this.drag.type=='draw') { this.drag = null; this.draft = null; }
                else if (this.tool!='select') this.set_tool('select');
                else { this.sel = null; this.multi = []; }
            }
            else if (e.key=='Delete' || e.key=='Backspace') { e.preventDefault(); this.delete_selection(); }
            else if (e.key.indexOf('Arrow')==0 && this.selected_room) {
                e.preventDefault();
                var step = (this.plan.grid>0 ? this.plan.grid : 0.01)*(e.shiftKey ? 10 : 1);
                var dx = e.key=='ArrowLeft' ? -step : (e.key=='ArrowRight' ? step : 0);
                var dy = e.key=='ArrowUp' ? -step : (e.key=='ArrowDown' ? step : 0);
                this.nudge(this.selected_room, dx, dy);
            }
        },

        // ------------------------------------------------------------------
        // Editing actions
        // ------------------------------------------------------------------
        set_tool: function(t) {
            this.tool = t;
            this.ghost = null;
            this.split_ghost = null;
            this.hover = null;
            this.draft = null;
        },
        select: function(s) {
            this.sel = s;
            this.multi = [];
            this.tab = 'details';
            if (s && s.kind=='opening') {
                var op = this.selected_opening;
                if (op) this.last_size[op.kind] = { width: op.width, height: op.height };
            }
        },
        toggle_multi: function(room) {
            if (!this.multi.length && this.selected_room) this.multi = [this.selected_room.id];
            var i = this.multi.indexOf(room.id);
            if (i==-1) this.multi.push(room.id); else this.multi.splice(i,1);
            this.sel = this.multi.length==1 ? { kind:'room', id:this.multi[0] } : null;
            if (this.multi.length==1) this.multi = [];
            this.tab = 'details';
        },
        add_room: function(points) {
            var n = this.plan.rooms.length+1;
            var name = "Room "+n;
            while (this.plan.rooms.some(function(r){ return r.name==name; })) name = "Room "+(++n);
            var r = M.new_room(this.plan, this.level.id, points, name);
            this.select({ kind:'room', id:r.id });
            this.commit();
            var self = this;
            this.$nextTick(function() {
                var el = self.$refs.room_name;
                if (el) { el.focus(); el.select(); }
            });
        },
        nudge: function(room, dx, dy) {
            var d = this.begin_shape_drag('move', [room], {x:0,y:0});
            room.points = room.points.map(function(q){ return [M.round(q[0]+dx), M.round(q[1]+dy)]; });
            this.update_dragged_openings(d);
            this.commit();
        },
        on_room_name: function(r) {
            var name = (r.name||"").trim() || "Room";
            var base = name, k = 2;
            while (this.plan.rooms.some(function(o){ return o!==r && o.name==name; })) name = base+" "+(k++);
            r.name = name;
            if (r.temp_auto) {
                var t = M.guess_temperature(name);
                if (t!==null) r.temperature = t;
            }
            this.commit();
        },
        on_room_temperature: function(r) {
            r.temp_auto = false;
        },
        set_heated: function(r, heated) {
            r.heated = heated;
            this.commit();
        },
        delete_selection: function() {
            var self = this;
            if (this.multi.length) {
                this.multi_rooms.forEach(function(r){ self.remove_room(r); });
                this.multi = [];
                this.sel = null;
                this.commit();
            } else if (this.selected_room) {
                this.remove_room(this.selected_room);
                this.sel = null;
                this.commit();
            } else if (this.selected_opening) {
                this.plan.openings.splice(this.plan.openings.indexOf(this.selected_opening), 1);
                this.sel = null;
                this.commit();
            }
        },
        remove_room: function(room) {
            var self = this;
            var others = this.plan.rooms.filter(function(r){ return r!==room && r.level==room.level; });
            // Remove windows and doors that only belong to this room
            M.openings_on_room(this.plan, room).forEach(function(o) {
                var shared = others.some(function(r) {
                    return M.openings_on_room(self.plan, r).some(function(x){ return x.opening===o.opening; });
                });
                if (!shared) {
                    var i = self.plan.openings.indexOf(o.opening);
                    if (i!=-1) self.plan.openings.splice(i,1);
                }
            });
            this.plan.rooms.splice(this.plan.rooms.indexOf(room), 1);
        },
        merge_selected: function() {
            // the largest room keeps its name and settings
            var rooms = this.multi_rooms.slice().sort(function(a,b){ return M.area(b.points)-M.area(a.points); });
            if (rooms.length<2) return;
            var level = rooms[0].level;
            if (rooms.some(function(r){ return r.level!=level; })) {
                alert("Rooms need to be on the same floor to merge");
                return;
            }
            var merged = M.union(rooms.map(function(r){ return r.points; }));
            if (!merged) {
                alert(rooms.every(function(r){ return M.is_orthogonal(r.points); }) ?
                    "Rooms need to touch or overlap to merge into one room" : "Rooms with angled walls can not be merged yet");
                return;
            }
            var keep = rooms[0];
            keep.edges = M.remap_edge_props(rooms, merged);
            keep.points = merged;
            for (var i=1; i<rooms.length; i++) {
                keep.radiators = keep.radiators.concat(rooms[i].radiators);
                keep.ufh = keep.ufh.concat(rooms[i].ufh);
                keep.extra = keep.extra.concat(rooms[i].extra);
                this.plan.rooms.splice(this.plan.rooms.indexOf(rooms[i]), 1);
            }
            this.multi = [];
            this.select({ kind:'room', id:keep.id });
            this.commit();
        },
        copy_room_to_level: function(room, offset) {
            var li = this.plan.levels.indexOf(this.level) + offset;
            if (li<0) return;
            if (li>=this.plan.levels.length) this.add_level();
            var level = this.plan.levels[li];
            var name = room.name+" above";
            var r = M.new_room(this.plan, level.id, M.clone(room.points), name);
            r.temperature = room.temperature;
            r.edges = M.clone(room.edges);
            this.level_id = level.id;
            this.select({ kind:'room', id:r.id });
            this.commit();
            var self = this;
            this.$nextTick(function() {
                var el = self.$refs.room_name;
                if (el) { el.focus(); el.select(); }
            });
        },
        set_edge_prop: function(room, edge, changes) {
            var edges = M.clone(room.edges||{});
            var p = edges[edge] || {};
            for (var z in changes) {
                if (changes[z]===null || changes[z]==="") delete p[z];
                else p[z] = changes[z];
            }
            if (Object.keys(p).length) edges[edge] = p; else delete edges[edge];
            room.edges = edges;
        },
        // Where the split tool would cut a wall near p, or null
        split_position: function(p) {
            var tol = 14/this.view.scale, best = null, self = this;
            this.level_rooms.forEach(function(room) {
                M.edges(room.points).forEach(function(e) {
                    if (e.len<M.EPS) return;
                    var d = dist_to_segment(p.x, p.y, e.x1, e.y1, e.x2, e.y2);
                    if (d>=tol || (best && d>=best.d)) return;
                    var P = self.split_point(e, p.x, p.y);
                    if (P) best = { d:d, room:room, edge:e.i, axis:e.axis, nx:e.nx, ny:e.ny, x:P[0], y:P[1] };
                });
            });
            return best;
        },
        // Point on an edge nearest x,y, snapped to the grid along walls square to it
        split_point: function(e, x, y) {
            var g = this.snap_step();
            var t = M.along(e, x, y);
            t = e.axis=='d' ? M.round(t, 2) : M.round(Math.round(t/g)*g);
            if (t<e.lo+0.05 || t>e.hi-0.05) return null;
            if (e.axis=='h') return [t, e.c];
            if (e.axis=='v') return [e.c, t];
            var q = M.line_point(e, t);
            return [M.round(q[0]), M.round(q[1])];
        },
        split_ghost_line: function(g) {
            var x = this.sx(g.x), y = this.sy(g.y), r = 14;
            return { x1: x-g.nx*r, y1: y-g.ny*r, x2: x+g.nx*r, y2: y+g.ny*r };
        },
        // Add a split point to a wall so each part can be dragged on its own to make a step.
        // The split is two points in the same place, joined by a zero length wall that
        // becomes the step, they are tidied away again if the wall is left straight.
        split_edge: function(room, index, x, y) {
            var pts = room.points, n = pts.length;
            var e = M.edges(pts)[index];
            if (!e || e.len<M.EPS) return;
            var P = this.split_point(e, x, y);
            if (!P) return;
            var edges = {};
            for (var i in room.edges) {
                var k = parseInt(i);
                if (k<index) edges[k] = room.edges[i];
                else if (k==index) {
                    // both parts and the step keep the settings of the wall that was split
                    edges[k] = room.edges[i];
                    edges[k+1] = M.clone(room.edges[i]);
                    edges[k+2] = M.clone(room.edges[i]);
                }
                else edges[k+2] = room.edges[i];
            }
            var np = M.clone(pts);
            np.splice(index+1, 0, P, M.clone(P));
            room.points = np;
            room.edges = edges;
            this.select({ kind:'wall', room:room.id, edge:index+2, x:P[0]+e.ux*0.01, y:P[1]+e.uy*0.01 });
            this.commit();
        },
        set_wall_type: function(w, type) {
            var R = this.room_by_id(w.room);
            if (w.kind=='internal') {
                this.set_edge_prop(R, w.edge, { int_type: type });
                var S = this.room_by_id(w.other);
                if (S) this.set_edge_prop(S, w.other_edge, { int_type: type });
            } else {
                this.set_edge_prop(R, w.edge, { ext_type: type });
            }
            this.commit();
        },
        wall_thickness_override: function(w) {
            var p = (this.room_by_id(w.room).edges||{})[w.edge] || {};
            return typeof p.thickness=='number' ? p.thickness : "";
        },
        wall_default_thickness: function(w) {
            var p = M.clone((this.room_by_id(w.room).edges||{})[w.edge] || {});
            delete p.thickness;
            return M.edge_thickness(this.plan, p);
        },
        set_wall_thickness: function(w, value) {
            var v = parseFloat(String(value).replace(",", "."));
            this.set_edge_prop(this.room_by_id(w.room), w.edge, { thickness: isNaN(v) || v<0 ? null : v });
            this.commit();
        },
        set_wall_boundary: function(w, boundary) {
            var R = this.room_by_id(w.room);
            var p = (R.edges||{})[w.edge] || {};
            var changes = { boundary: boundary=='external' ? null : boundary };
            if (boundary=='neighbour' && !p.ext_type) changes.ext_type = this.plan.defaults.wall_party;
            if (boundary=='external' && p.ext_type==this.plan.defaults.wall_party) changes.ext_type = null;
            this.set_edge_prop(R, w.edge, changes);
            this.commit();
        },
        add_opening_to_wall: function(w, kind) {
            var size = this.last_size[kind];
            var width = Math.min(size.width, M.round(w.len));
            // in the middle of the wall, and halfway through it for a wall between rooms
            var pos = this.point_on_edge(w, (w.lo+w.hi)/2, width);
            pos.x = M.round(pos.x + w.nx*w.dist/2);
            pos.y = M.round(pos.y + w.ny*w.dist/2);
            var op = {
                id: "o"+(this.plan.next_id++), level: w.level, kind: kind,
                x: pos.x, y: pos.y, axis: pos.axis,
                width: width, height: size.height, type: null
            };
            if (pos.dir) op.dir = pos.dir;
            this.plan.openings.push(op);
            this.select({ kind:'opening', id:op.id });
            this.commit();
        },
        opening_wall: function(op) {
            var walls = this.analysis.walls;
            for (var i=0; i<walls.length; i++) {
                if (walls[i].openings.indexOf(op.id)!=-1) return walls[i];
            }
            return null;
        },
        on_opening_size: function(op) {
            this.last_size[op.kind] = { width: op.width, height: op.height };
            this.commit();
        },
        set_room_surface: function(r, which, field, value) {
            var s = M.clone(r[which] || {});
            if (value===null || value==="") delete s[field]; else s[field] = value;
            r[which] = Object.keys(s).length ? s : null;
            this.commit();
        },
        add_radiator: function(r) {
            var last = r.radiators[r.radiators.length-1];
            r.radiators.push(last ? M.clone(last) : { name: "Double panel 1000x600", heat50k: 1790 });
            this.commit();
        },
        add_ufh: function(r) {
            r.ufh.push({ name: "16mm diameter, 150mm spacing", area: M.round(M.area(r.points),1), flooring: 0.1 });
            this.commit();
        },
        add_extra: function(r) {
            r.extra.push({ type: this.plan.defaults.window, area: 1.0, boundary: "external" });
            this.commit();
        },
        remove_item: function(list, i) {
            list.splice(i,1);
            this.commit();
        },

        // ------------------------------------------------------------------
        // Floors
        // ------------------------------------------------------------------
        add_level: function() {
            var names = ["Ground floor","First floor","Second floor","Third floor","Fourth floor"];
            var n = this.plan.levels.length;
            var top = this.plan.levels[n-1];
            var level = { id: "L"+(this.plan.next_id++), name: names[n] || ("Floor "+n), height: top ? top.height : 2.4 };
            this.plan.levels.push(level);
            this.level_id = level.id;
            this.sel = null;
            this.commit();
            return level;
        },
        rename_level: function(level) {
            var name = prompt("Floor name", level.name);
            if (name) { level.name = name; this.commit(); }
        },
        delete_level: function(level) {
            if (this.plan.levels.length<2) return;
            var rooms = this.plan.rooms.filter(function(r){ return r.level==level.id; });
            if (rooms.length && !confirm("Delete "+level.name+" and its "+rooms.length+" room(s)?")) return;
            this.plan.rooms = this.plan.rooms.filter(function(r){ return r.level!=level.id; });
            this.plan.openings = this.plan.openings.filter(function(o){ return o.level!=level.id; });
            this.plan.levels.splice(this.plan.levels.indexOf(level), 1);
            if (this.level_id==level.id) this.level_id = this.plan.levels[0].id;
            this.sel = null;
            this.commit();
        },
        set_level: function(level) {
            this.level_id = level.id;
            if (this.sel && this.sel.kind=='room' && this.selected_room && this.selected_room.level!=level.id) this.sel = null;
            if (this.sel && this.sel.kind!='room') this.sel = null;
            this.multi = [];
            this.dim_edit = null;
        },
        goto_room: function(r) {
            this.level_id = r.level;
            this.select({ kind:'room', id:r.id });
        },

        // ------------------------------------------------------------------
        // Building settings
        // ------------------------------------------------------------------
        rename_type: function(old_name, e) {
            var new_name = e.target.value.trim();
            var plan = this.plan;
            if (!new_name || new_name==old_name || plan.element_type[new_name]) {
                e.target.value = old_name;
                return;
            }
            var types = {};
            for (var z in plan.element_type) types[z==old_name ? new_name : z] = plan.element_type[z];
            plan.element_type = types;
            function swap(v) { return v==old_name ? new_name : v; }
            for (var z in plan.defaults) plan.defaults[z] = swap(plan.defaults[z]);
            plan.rooms.forEach(function(r) {
                var edges = M.clone(r.edges);
                for (var i in edges) {
                    if (edges[i].ext_type) edges[i].ext_type = swap(edges[i].ext_type);
                    if (edges[i].int_type) edges[i].int_type = swap(edges[i].int_type);
                }
                r.edges = edges;
                if (r.floor && r.floor.type) r.floor.type = swap(r.floor.type);
                if (r.ceiling && r.ceiling.type) r.ceiling.type = swap(r.ceiling.type);
                r.extra.forEach(function(x){ x.type = swap(x.type); });
            });
            plan.openings.forEach(function(o){ if (o.type) o.type = swap(o.type); });
            this.commit();
        },
        type_in_use: function(name) {
            var plan = this.plan;
            for (var z in plan.defaults) if (plan.defaults[z]==name) return true;
            return plan.rooms.some(function(r) {
                for (var i in r.edges) if (r.edges[i].ext_type==name || r.edges[i].int_type==name) return true;
                if (r.floor && r.floor.type==name) return true;
                if (r.ceiling && r.ceiling.type==name) return true;
                return r.extra.some(function(x){ return x.type==name; });
            }) || plan.openings.some(function(o){ return o.type==name; });
        },
        delete_type: function(name) {
            if (this.type_in_use(name)) {
                alert("\""+name+"\" is still in use, change the walls, windows or defaults that use it first");
                return;
            }
            var types = M.clone(this.plan.element_type);
            delete types[name];
            this.plan.element_type = types;
            this.commit();
        },
        add_type: function() {
            var n = 1, name = "Element "+n;
            while (this.plan.element_type[name]) name = "Element "+(++n);
            this.$set(this.plan.element_type, name, { uvalue: 1.0 });
            this.commit();
        },
        add_library_type: function() {
            var item = this.library.filter(function(l){ return l.name==this.lib_choice; }, this)[0];
            this.lib_choice = "";
            if (!item) return;
            this.$set(this.plan.element_type, item.name, { uvalue: item.uvalue });
            this.commit();
        },
        add_boundary: function() {
            var name = this.new_boundary.name.trim().toLowerCase();
            if (!name || this.plan.T[name]!==undefined) return;
            this.$set(this.plan.T, name, 1*this.new_boundary.temperature);
            this.new_boundary.name = "";
            this.commit();
        },
        delete_boundary: function(name) {
            if (['external','ground','unheated'].indexOf(name)!=-1) return;
            var T = M.clone(this.plan.T);
            delete T[name];
            this.plan.T = T;
            this.commit();
        },
        apply_default_ach: function() {
            var ach = this.plan.default_ach;
            this.plan.rooms.forEach(function(r){ r.ach = ach; });
            this.commit();
        },

        // ------------------------------------------------------------------
        // Files
        // ------------------------------------------------------------------
        export_config: function() {
            var cfg = M.clone(this.analysis.config);
            cfg.floorplan = M.clone(this.plan);
            return cfg;
        },
        load_plan: function(plan) {
            this.plan = normalize_plan(plan);
            this.level_id = this.plan.levels[0].id;
            this.sel = null;
            this.multi = [];
            this.tool = 'select';
            this.reset_history();
            this.save_local();
            var self = this;
            this.$nextTick(function(){ self.fit(); self.run_calc(); });
        },
        file_new: function() {
            if (this.plan.rooms.length && !confirm("Start a new plan? Unsaved changes to this plan will be lost.")) return;
            var plan = M.default_plan();
            plan.T = M.clone(this.plan.T);
            plan.element_type = M.clone(this.plan.element_type);
            plan.defaults = M.clone(this.plan.defaults);
            plan.degreedays = this.plan.degreedays;
            this.show_intro = false;
            this.load_plan(plan);
            this.set_tool('room');
        },
        file_example: function() {
            if (this.plan.rooms.length && !confirm("Load the example house? Unsaved changes to this plan will be lost.")) return;
            this.load_plan(M.example_plan());
        },
        file_save: function() {
            var date = new Date();
            var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            var h = date.getHours(); if (h<10) h = "0"+h;
            var m = date.getMinutes(); if (m<10) m = "0"+m;
            var datestr = date.getDate()+months[date.getMonth()]+h+m;
            download_data("heatlossjs_"+this.plan.project_name+"_"+datestr+".json", JSON.stringify(this.export_config(), null, 2));
        },
        file_open: function(e) {
            var self = this;
            var file = e.target.files[0];
            e.target.value = "";
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(ev) {
                var c;
                try { c = JSON.parse(ev.target.result); } catch (err) { alert("Could not read this file as JSON"); return; }
                if (!c || !c.floorplan) {
                    alert("This file does not contain a floor plan. It can be opened in the table view instead.");
                    return;
                }
                var plan = c.floorplan;
                // Settings and radiators may have been edited in the table view since
                ['project_name','degreedays','heating_MWT','heatpump_flow_rate','heatpump_capacity','cop_calculation_method','T','element_type'].forEach(function(k) {
                    if (c[k]!==undefined) plan[k] = c[k];
                });
                normalize_plan(plan);
                if (c.rooms) {
                    var names = M.analyse(plan).names;
                    plan.rooms.forEach(function(r) {
                        var cr = c.rooms[names[r.id]];
                        if (!r.heated || !cr) return;
                        r.temperature = cr.temperature;
                        r.ach = cr.air_change_an_hour;
                        r.radiators = (cr.radiators||[]).map(function(rad){ return { name: rad.name, heat50k: rad.heat50k, model: rad.model, m: rad.m, c: rad.c }; });
                        r.ufh = (cr.ufh||[]).map(function(u){ return { name: u.name, area: u.area, flooring: u.flooring }; });
                    });
                }
                self.show_intro = false;
                self.load_plan(plan);
            };
            reader.readAsText(file);
        },
        open_table: function() {
            try {
                localStorage.setItem("heatlossjs_floorplan_config", JSON.stringify(this.export_config()));
            } catch (e) {
                alert("Could not hand the plan over to the table view, use Save and then Open there instead");
                return;
            }
            window.open("index.php?load=floorplan", "_blank");
        }
    }
});
