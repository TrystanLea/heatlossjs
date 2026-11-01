<?php $v = 2; ?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>HeatLoss.js floor plan</title>
<link rel="stylesheet" type="text/css" href="heatlossjs/floorplan.css?v=<?php echo $v; ?>" />
<script src="https://cdn.jsdelivr.net/npm/vue@2.7.16/dist/vue.min.js"></script>
</head>
<body>

<div id="floorplan"></div>

<script type="text/x-template" id="floorplan-template">
<div id="floorplan" class="fp">

  <!-- ============================== Top bar ============================== -->
  <header class="fp-top">
    <div class="fp-brand"><b>HeatLoss.js</b><span>floor plan</span></div>

    <div class="fp-tools">
      <button v-for="t in tools" :key="t.id" :class="['fp-tool', {active: tool==t.id}]" @click="set_tool(t.id)" :title="t.title">
        <svg viewBox="0 0 24 24" class="fp-icon"><path :d="icons[t.id]"/></svg>
        <span class="fp-tool-label">{{ t.label }}</span><kbd>{{ t.key }}</kbd>
      </button>
      <span class="fp-sep"></span>
      <button class="fp-tool" @click="undo" :disabled="history_index<=0" title="Undo (Ctrl+Z)"><svg viewBox="0 0 24 24" class="fp-icon"><path :d="icons.undo"/></svg></button>
      <button class="fp-tool" @click="redo" :disabled="history_index>=history.length-1" title="Redo (Ctrl+Y)"><svg viewBox="0 0 24 24" class="fp-icon"><path :d="icons.redo"/></svg></button>
    </div>

    <div class="fp-headline" v-if="calc" @click="tab='results'" title="Show results">
      <div><b>{{ fmt(calc.house.heatloss) }}</b> <small>W</small></div>
      <div class="fp-headline-sub">{{ fmt(calc.house.kwh) }} kWh/yr</div>
    </div>

    <div class="fp-file">
      <button @click="file_new">New</button>
      <button @click="$refs.open.click()">Open</button>
      <input type="file" ref="open" style="display:none" accept=".json,application/json" @change="file_open">
      <button @click="file_save">Save</button>
      <button @click="open_table" title="Open the generated calculation in the original table view">Table view</button>
    </div>
  </header>

  <div class="fp-main">

    <!-- ============================== Canvas ============================== -->
    <div class="fp-canvas" ref="canvas">

      <div class="fp-levels">
        <button v-for="l in plan.levels.slice().reverse()" :key="l.id" :class="['fp-level', {active: l.id==level.id}]"
          @click="set_level(l)" @dblclick="rename_level(l)" title="Double click to rename">{{ l.name }}</button>
        <button class="fp-level fp-level-add" @click="add_level" title="Add a floor above">+ Floor</button>
      </div>

      <svg ref="svg" class="fp-svg" :width="size.w" :height="size.h" :style="{cursor: cursor}"
        @pointerdown.prevent="on_down" @pointermove="on_move" @pointerup="on_up" @pointercancel="on_up"
        @pointerleave="hover=null; ghost=null" @wheel.prevent="on_wheel" @contextmenu.prevent>
        <defs>
          <pattern id="fp-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" class="hatch-bg"/>
            <line x1="0" y1="0" x2="0" y2="8" class="hatch-line"/>
          </pattern>
        </defs>

        <g class="fp-static">
          <path :d="grid.minor" class="grid-minor"/>
          <path :d="grid.major" class="grid-major"/>

          <polygon v-for="(w,i) in ghost_bands" :key="'gb'+i" :points="rect_points(w.band)" class="ghost-band"/>
          <polygon v-for="r in ghost_rooms" :key="'g'+r.id" :points="poly(r.points)" class="ghost"/>

          <polygon v-for="(w,i) in level_bands" :key="'b'+i" :points="rect_points(w.band)" :class="['band', 'band-'+wall_class(w)]"/>

          <polygon v-for="r in level_rooms" :key="r.id" :points="poly(r.points)" :fill="room_fill(r)"
            :class="['room', {hover: hover_room==r.id && !drag, multi: multi.indexOf(r.id)!=-1}]"/>

          <line v-for="(w,i) in level_walls" :key="'w'+i" :x1="sx(w.x1)" :y1="sy(w.y1)" :x2="sx(w.x2)" :y2="sy(w.y2)"
            :class="['wall', 'wall-'+wall_class(w)]"/>

          <polygon v-if="selected_room && selected_room.level==level.id" :points="poly(selected_room.points)" class="room-selected"/>
          <line v-if="selected_wall" :x1="sx(selected_wall.x1)" :y1="sy(selected_wall.y1)" :x2="sx(selected_wall.x2)" :y2="sy(selected_wall.y2)" class="wall-selected"/>

          <polygon v-for="o in level_opening_shapes" :key="'ob'+o.op.id" :points="rect_points(o.rect)"
            :class="['opening-band', 'opening-band-'+o.op.kind, {selected: selected_opening===o.op}]"/>
          <line v-for="op in level_openings" :key="op.id" v-bind="opening_line(op)"
            :class="['opening', 'opening-'+op.kind, {selected: selected_opening===op}]"/>
          <line v-if="ghost" v-bind="opening_line(ghost)" :class="['opening', 'opening-'+ghost.kind, 'opening-ghost']"/>

          <g v-for="r in level_rooms" :key="'l'+r.id" :class="['room-label', {small: room_label(r).small}]">
            <text v-for="(l,i) in room_label(r).lines" :key="i" :x="room_label(r).x" :y="room_label(r).y+i*16" :class="l.cls">{{ l.text }}</text>
          </g>

          <line v-for="(g,i) in guides" :key="'gd'+i" :x1="g.axis=='x' ? sx(g.v) : 0" :x2="g.axis=='x' ? sx(g.v) : size.w"
            :y1="g.axis=='y' ? sy(g.v) : 0" :y2="g.axis=='y' ? sy(g.v) : size.h" class="guide"/>

          <g v-if="draft">
            <rect :x="sx(Math.min(draft.x1,draft.x2))" :y="sy(Math.min(draft.y1,draft.y2))"
              :width="Math.abs(draft.x2-draft.x1)*view.scale" :height="Math.abs(draft.y2-draft.y1)*view.scale" class="draft"/>
            <text class="draft-dim" :x="sx((draft.x1+draft.x2)/2)" :y="sy(Math.min(draft.y1,draft.y2))-8">{{ Math.abs(draft.x2-draft.x1).toFixed(2) }} m</text>
            <text class="draft-dim" :x="sx(Math.max(draft.x1,draft.x2))+8" :y="sy((draft.y1+draft.y2)/2)" text-anchor="start">{{ Math.abs(draft.y2-draft.y1).toFixed(2) }} m</text>
            <text class="draft-area" :x="sx((draft.x1+draft.x2)/2)" :y="sy((draft.y1+draft.y2)/2)">{{ (Math.abs(draft.x2-draft.x1)*Math.abs(draft.y2-draft.y1)).toFixed(1) }} m²</text>
          </g>

          <g v-if="selected_room && selected_room.level==level.id && !drag">
            <circle v-for="(p,i) in selected_room.points" :key="'h'+i" :cx="sx(p[0])" :cy="sy(p[1])" r="5" class="handle"/>
          </g>
        </g>

        <g v-for="d in room_dims" :key="'d'+d.edge" class="dim" @pointerdown.stop.prevent="edit_dim(d)">
          <title>Click to type an exact length</title>
          <rect :x="d.x-d.w/2" :y="d.y-10" :width="d.w" height="20" rx="4"/>
          <text :x="d.x" :y="d.y+4">{{ d.text }}</text>
        </g>

        <g class="north" :transform="'translate('+(size.w-44)+',44)'" @pointerdown.stop.prevent="start_north">
          <title>Drag to rotate north (hold shift for 1° steps)</title>
          <circle r="26"/>
          <g :transform="'rotate('+plan.north+')'">
            <path d="M0,-19 L7,7 L0,2 L-7,7 Z"/>
            <text y="-6" transform="translate(0,26)">N</text>
          </g>
        </g>

        <g class="scalebar" :transform="'translate(16,'+(size.h-22)+')'">
          <path :d="'M0 0V6H'+scale_bar.px+'V0'"/>
          <text :x="scale_bar.px+6" y="7">{{ scale_bar.m }} m</text>
        </g>
      </svg>

      <input v-if="dim_edit" ref="dim_input" class="fp-dim-input" :style="{left: (dim_edit.x-38)+'px', top: (dim_edit.y-14)+'px'}"
        v-model="dim_edit.value" @keydown.enter.prevent="apply_dim" @keydown.esc="dim_edit=null" @blur="apply_dim">

      <div class="fp-hint" v-if="!level_rooms.length && !draft">
        <template v-if="level_index>0 && ghost_rooms.length">The floor below is shown faintly so you can trace over it.<br></template>
        <template v-if="tool=='room'">Drag on the grid to draw a room</template>
        <template v-else>Press <kbd>R</kbd> or choose <b>Room</b>, then drag to draw a room</template>
      </div>

      <div class="fp-intro" v-if="show_intro">
        <b>Welcome!</b> This is the stone mid terrace from the main heatlossjs example, with its 550mm walls, to show how it works. Draw rooms, add windows and doors, and the
        heat loss is calculated as you go.
        <div class="fp-intro-buttons">
          <button class="primary" @click="file_new">Start my own plan</button>
          <button @click="show_intro=false">Explore the example</button>
        </div>
      </div>

      <div class="fp-zoom">
        <button @click="zoom(1/1.25)" title="Zoom out (-)">−</button>
        <button @click="zoom(1.25)" title="Zoom in (+)">+</button>
        <button @click="fit" title="Fit to screen (F)">Fit</button>
        <label title="Colour rooms by heat loss per m²"><input type="checkbox" v-model="show_heat"> Heat map</label>
      </div>

      <div class="fp-legend" v-if="show_heat && calc">
        <span>0</span><div class="fp-legend-bar"></div><span>{{ max_wm2 }}+ W/m²</span>
      </div>
    </div>

    <!-- ============================== Sidebar ============================== -->
    <aside class="fp-side">
      <nav class="fp-tabs">
        <button :class="{active: tab=='details'}" @click="tab='details'">Selection</button>
        <button :class="{active: tab=='building'}" @click="tab='building'">Building</button>
        <button :class="{active: tab=='results'}" @click="tab='results'">Results</button>
      </nav>

      <div class="fp-panel" v-if="tab=='details'">

        <!-- Several rooms -->
        <template v-if="multi_rooms.length>1">
          <h3>{{ multi_rooms.length }} rooms selected</h3>
          <p class="fp-muted">{{ multi_rooms.map(function(r){return r.name}).join(", ") }}</p>
          <div class="fp-buttons">
            <button class="primary" @click="merge_selected">Merge into one room</button>
            <button class="danger" @click="delete_selection">Delete</button>
          </div>
          <p class="fp-muted">Merging is how to make L-shaped rooms: draw two rectangles that touch, shift-click both, then merge.</p>
        </template>

        <!-- Room -->
        <template v-else-if="selected_room">
          <div class="fp-field">
            <label>Room name</label>
            <input ref="room_name" class="fp-name" type="text" v-model="selected_room.name" @change="on_room_name(selected_room)" list="fp-room-names">
          </div>
          <div class="fp-row">
            <label class="fp-check"><input type="checkbox" :checked="selected_room.heated" @change="set_heated(selected_room, $event.target.checked)"> Heated</label>
            <span class="fp-muted" v-if="!selected_room.heated">Unheated spaces like garages and porches count as the <i>unheated</i> boundary for rooms next to them.</span>
          </div>

          <template v-if="selected_room.heated">
            <div class="fp-grid3">
              <div class="fp-field">
                <label>Temperature</label>
                <div class="fp-unit"><input type="number" step="0.5" v-model.number="selected_room.temperature" @input="on_room_temperature(selected_room)" @change="commit"><span>°C</span></div>
              </div>
              <div class="fp-field">
                <label>Air changes</label>
                <div class="fp-unit"><input type="number" step="0.1" min="0" v-model.number="selected_room.ach" @change="commit"><span>/hr</span></div>
              </div>
              <div class="fp-field">
                <label>Ceiling height</label>
                <div class="fp-unit"><input type="number" step="0.05" min="0" v-model.number="selected_room.height" :placeholder="level.height" @change="commit"><span>m</span></div>
              </div>
            </div>
          </template>

          <div class="fp-stats">
            <div><span>Floor area</span><b>{{ fmt(room_area(selected_room),1) }} m²</b></div>
            <div><span>Volume</span><b>{{ fmt(room_area(selected_room)*room_height(selected_room),1) }} m³</b></div>
            <template v-if="room_calc(selected_room)">
              <div><span>Heat loss</span><b class="fp-big">{{ fmt(room_calc(selected_room).heat) }} W</b></div>
              <div><span>Per m²</span><b>{{ fmt(room_wm2(selected_room)) }} W/m²</b></div>
            </template>
          </div>

          <h4>Walls <small class="fp-muted">click a length to edit</small></h4>
          <div class="fp-walls">
            <div v-for="(e,i) in room_dims" :key="i" class="fp-wall-row">
              <span class="fp-muted">Wall {{ i+1 }}</span>
              <input type="number" step="0.05" min="0.1" :value="e.len.toFixed(2)" @change="set_edge_length(selected_room, e.edge, parseFloat($event.target.value))"><span class="fp-muted">m</span>
            </div>
          </div>

          <template v-if="room_calc(selected_room)">
            <h4>Heat loss breakdown</h4>
            <table class="fp-table">
              <tr><th>Element</th><th>To</th><th class="num">m²</th><th class="num">W</th></tr>
              <tr v-for="(row,i) in breakdown(selected_room)" :key="i">
                <td>{{ row.type }} <small class="fp-muted" v-if="row.orientation">{{ row.orientation }}</small></td>
                <td>{{ row.boundary }}</td>
                <td class="num">{{ row.A===null ? '' : fmt(row.A,1) }}</td>
                <td class="num">{{ fmt(row.heat) }}</td>
              </tr>
              <tr class="fp-total-row"><td colspan="3">Total</td><td class="num">{{ fmt(room_calc(selected_room).heat) }}</td></tr>
            </table>

            <h4>Radiators <button class="fp-link" @click="add_radiator(selected_room)">+ Add</button></h4>
            <div v-for="(rad,i) in selected_room.radiators" :key="'rad'+i" class="fp-rad">
              <input type="text" v-model="rad.name" @change="commit">
              <div class="fp-unit"><input type="number" step="10" v-model.number="rad.heat50k" @change="commit" v-if="!rad.model || rad.model=='pow'"><span>W@50K</span></div>
              <span class="fp-rad-out">{{ room_calc(selected_room).radiators[i] ? fmt(room_calc(selected_room).radiators[i].heat) : '' }} W</span>
              <button class="fp-x" @click="remove_item(selected_room.radiators,i)" title="Remove">×</button>
            </div>
            <h4>Underfloor heating <button class="fp-link" @click="add_ufh(selected_room)">+ Add</button></h4>
            <div v-for="(u,i) in selected_room.ufh" :key="'ufh'+i" class="fp-rad">
              <div class="fp-unit"><input type="number" step="0.1" v-model.number="u.area" @change="commit"><span>m²</span></div>
              <div class="fp-unit" title="Floor covering resistance"><input type="number" step="0.05" v-model.number="u.flooring" @change="commit"><span>m²K/W</span></div>
              <span class="fp-rad-out">{{ room_calc(selected_room).ufh[i] ? fmt(room_calc(selected_room).ufh[i].heat) : '' }} W</span>
              <button class="fp-x" @click="remove_item(selected_room.ufh,i)" title="Remove">×</button>
            </div>
            <div v-if="selected_room.radiators.length || selected_room.ufh.length"
              :class="['fp-emitter-check', room_calc(selected_room).total_heat_output>=room_calc(selected_room).heat-1 ? 'ok' : 'short']">
              Output {{ fmt(room_calc(selected_room).total_heat_output) }} W at {{ plan.heating_MWT }}°C MWT
              vs {{ fmt(room_calc(selected_room).heat) }} W needed
            </div>

            <details class="fp-advanced">
              <summary>Floor, ceiling and extra elements</summary>
              <p class="fp-muted">Floors and ceilings are worked out from the floors above and below. These settings apply to the parts not over or under another room.</p>
              <div class="fp-grid2">
                <div class="fp-field">
                  <label>Floor type</label>
                  <select :value="(selected_room.floor||{}).type || ''" @change="set_room_surface(selected_room,'floor','type',$event.target.value)">
                    <option value="">Default</option>
                    <option v-for="t in element_type_names" :key="t" :value="t">{{ t }}</option>
                  </select>
                </div>
                <div class="fp-field">
                  <label>Floor is to</label>
                  <select :value="(selected_room.floor||{}).boundary || ''" @change="set_room_surface(selected_room,'floor','boundary',$event.target.value)">
                    <option value="">Default</option>
                    <option v-for="b in boundary_names" :key="b" :value="b">{{ b }}</option>
                  </select>
                </div>
                <div class="fp-field">
                  <label>Ceiling type</label>
                  <select :value="(selected_room.ceiling||{}).type || ''" @change="set_room_surface(selected_room,'ceiling','type',$event.target.value)">
                    <option value="">Default</option>
                    <option v-for="t in element_type_names" :key="t" :value="t">{{ t }}</option>
                  </select>
                </div>
                <div class="fp-field">
                  <label>Ceiling is to</label>
                  <select :value="(selected_room.ceiling||{}).boundary || ''" @change="set_room_surface(selected_room,'ceiling','boundary',$event.target.value)">
                    <option value="">Default</option>
                    <option v-for="b in boundary_names" :key="b" :value="b">{{ b }}</option>
                  </select>
                </div>
              </div>
              <h4>Extra elements <button class="fp-link" @click="add_extra(selected_room)">+ Add</button></h4>
              <p class="fp-muted" v-if="!selected_room.extra.length">For anything not on the plan, e.g. roof lights.</p>
              <div v-for="(x,i) in selected_room.extra" :key="'x'+i" class="fp-rad">
                <select v-model="x.type" @change="commit"><option v-for="t in element_type_names" :key="t" :value="t">{{ t }}</option></select>
                <div class="fp-unit"><input type="number" step="0.1" v-model.number="x.area" @change="commit"><span>m²</span></div>
                <select v-model="x.boundary" @change="commit"><option v-for="b in boundary_names" :key="b" :value="b">{{ b }}</option></select>
                <button class="fp-x" @click="remove_item(selected_room.extra,i)" title="Remove">×</button>
              </div>
            </details>
          </template>

          <div class="fp-buttons">
            <button @click="copy_room_to_level(selected_room, 1)" title="Copy this room outline to the floor above">Copy to floor above</button>
            <button class="danger" @click="delete_selection">Delete room</button>
          </div>
        </template>

        <!-- Wall -->
        <template v-else-if="selected_wall">
          <h3>{{ wall_label(selected_wall) }}</h3>
          <p class="fp-muted">
            {{ room_name(selected_wall.room) }}<template v-if="selected_wall.other"> ↔ {{ room_name(selected_wall.other) }}</template>
            <template v-if="selected_wall.orientation"> · faces {{ selected_wall.orientation }}</template>
          </p>
          <div class="fp-field" v-if="selected_wall.axis!='d' && !selected_wall.other && selected_wall.kind!='junction'">
            <label>Wall thickness</label>
            <div class="fp-unit"><input type="number" step="0.01" min="0" :value="wall_thickness_override(selected_wall)" :placeholder="wall_default_thickness(selected_wall)"
              @change="set_wall_thickness(selected_wall, $event.target.value)"><span>m</span></div>
            <small class="fp-muted">Drawn outwards from the room. Leave blank for the default set in Building.</small>
          </div>
          <template v-if="selected_wall.item!==null">
            <div class="fp-field">
              <label>Construction</label>
              <select :value="selected_wall.type" @change="set_wall_type(selected_wall, $event.target.value)">
                <option v-for="t in element_type_names" :key="t" :value="t">{{ t }} ({{ plan.element_type[t].uvalue }})</option>
              </select>
            </div>
            <div class="fp-field" v-if="selected_wall.kind=='external'">
              <label>Other side is</label>
              <select :value="selected_wall.boundary" @change="set_wall_boundary(selected_wall, $event.target.value)">
                <option v-for="b in boundary_names" :key="b" :value="b">{{ b }} ({{ plan.T[b] }}°C)</option>
              </select>
              <small class="fp-muted">Use <i>neighbour</i> for a party wall with the house next door.</small>
            </div>
            <div class="fp-stats">
              <div><span>Length</span><b>{{ fmt(selected_wall.len,2) }} m</b></div>
              <div><span>Height</span><b>{{ fmt(room_height(room_by_id(selected_wall.room)),2) }} m</b></div>
              <div v-if="selected_wall.other"><span>Thickness</span><b>{{ fmt(selected_wall.dist,2) }} m</b></div>
              <template v-if="element_heat(selected_wall.room, selected_wall.item)">
                <div><span>Net area</span><b>{{ fmt(element_heat(selected_wall.room, selected_wall.item).A,1) }} m²</b></div>
                <div><span>Heat loss</span><b>{{ fmt(element_heat(selected_wall.room, selected_wall.item).heat) }} W</b></div>
              </template>
            </div>
            <div class="fp-buttons">
              <button @click="add_opening_to_wall(selected_wall,'window')">+ Window here</button>
              <button @click="add_opening_to_wall(selected_wall,'door')">+ Door here</button>
            </div>
          </template>
          <p v-else-if="selected_wall.kind=='junction'" class="fp-muted">This short stretch is where other walls meet this one, so it is not counted as an outside wall.</p>
          <p v-else class="fp-muted">This wall belongs to an unheated space and is not part of the calculation.</p>
          <p class="fp-muted" v-if="selected_wall.other">The thickness of a wall between rooms is the gap between them. Drag one face to change it, or the middle of the wall to move it.</p>
          <p class="fp-muted">Drag a wall to move it. Walls shared with other rooms move together, hold Alt to move just this one.</p>
        </template>

        <!-- Window or door -->
        <template v-else-if="selected_opening">
          <h3>{{ selected_opening.kind=='door' ? 'Door' : 'Window' }}</h3>
          <p class="fp-muted" v-if="opening_wall(selected_opening)">
            In {{ room_name(opening_wall(selected_opening).room) }}<template v-if="opening_wall(selected_opening).other"> / {{ room_name(opening_wall(selected_opening).other) }}</template>
            <template v-if="opening_wall(selected_opening).orientation">, faces {{ opening_wall(selected_opening).orientation }}</template>
          </p>
          <p class="fp-warning" v-else>Not on a heated room wall, so it is not counted. Drag it onto a wall.</p>
          <div class="fp-grid2">
            <div class="fp-field">
              <label>Width</label>
              <div class="fp-unit"><input type="number" step="0.05" min="0.1" v-model.number="selected_opening.width" @change="on_opening_size(selected_opening)"><span>m</span></div>
            </div>
            <div class="fp-field">
              <label>Height</label>
              <div class="fp-unit"><input type="number" step="0.05" min="0.1" v-model.number="selected_opening.height" @change="on_opening_size(selected_opening)"><span>m</span></div>
            </div>
          </div>
          <div class="fp-field">
            <label>Construction</label>
            <select :value="selected_opening.type || ''" @change="selected_opening.type = $event.target.value || null; commit()">
              <option value="">Default ({{ selected_opening.kind=='door' ? plan.defaults.door : plan.defaults.window }})</option>
              <option v-for="t in element_type_names" :key="t" :value="t">{{ t }} ({{ plan.element_type[t].uvalue }})</option>
            </select>
          </div>
          <div class="fp-row">
            <label class="fp-check"><input type="radio" value="window" v-model="selected_opening.kind" @change="commit"> Window</label>
            <label class="fp-check"><input type="radio" value="door" v-model="selected_opening.kind" @change="commit"> Door</label>
          </div>
          <div class="fp-buttons"><button class="danger" @click="delete_selection">Delete</button></div>
        </template>

        <!-- Nothing selected -->
        <template v-else>
          <h3>How to use</h3>
          <ol class="fp-help">
            <li><b>Draw rooms</b> with <kbd>R</kbd>: drag out each room. Draw rooms to their inside dimensions. Rooms that touch, or have a gap of up to {{ plan.wall_gap }} m for an internal wall, share a wall automatically. External walls are drawn outwards at the thickness set in Building.</li>
            <li><b>Name it</b>: type the name straight after drawing. Bedrooms get 18°C, living rooms 21°C and bathrooms 22°C automatically.</li>
            <li><b>Add windows and doors</b> with <kbd>W</kbd> and <kbd>D</kbd>: click on a wall.</li>
            <li><b>Add a floor</b> with <b>+ Floor</b>. The floor below shows faintly to trace over. Floors and ceilings between rooms are found from the overlap.</li>
            <li><b>Adjust</b>: drag walls, corners or whole rooms. Click a wall to set party walls or its construction, and click a length to type an exact size.</li>
          </ol>
          <p class="fp-muted">
            Pan by dragging empty space, zoom with the scroll wheel. Shift-click rooms to select several and merge them into L-shapes.
            <kbd>Alt</kbd> turns off snapping, <kbd>Del</kbd> deletes, <kbd>Ctrl+Z</kbd> undoes and arrow keys nudge.
          </p>
          <div class="fp-buttons"><button @click="file_example">Load example house</button></div>
        </template>
      </div>

      <!-- ============================== Building ============================== -->
      <div class="fp-panel" v-if="tab=='building'">
        <div class="fp-field">
          <label>Project name</label>
          <input type="text" v-model="plan.project_name" @change="commit">
        </div>

        <h4>Design conditions</h4>
        <table class="fp-table fp-edit">
          <tr v-for="(t,name) in plan.T" :key="name">
            <td>{{ name }}</td>
            <td class="num"><div class="fp-unit"><input type="number" step="0.5" v-model.number="plan.T[name]" @change="commit"><span>°C</span></div></td>
            <td class="fp-x-cell"><button class="fp-x" v-if="['external','ground','unheated'].indexOf(name)==-1" @click="delete_boundary(name)">×</button></td>
          </tr>
          <tr>
            <td><input type="text" placeholder="New boundary" v-model="new_boundary.name" @keydown.enter="add_boundary"></td>
            <td class="num"><div class="fp-unit"><input type="number" step="0.5" v-model.number="new_boundary.temperature"><span>°C</span></div></td>
            <td class="fp-x-cell"><button class="fp-link" @click="add_boundary">Add</button></td>
          </tr>
        </table>
        <div class="fp-grid2">
          <div class="fp-field">
            <label>Degree days</label>
            <input type="number" step="1" v-model.number="plan.degreedays" @change="commit">
          </div>
          <div class="fp-field">
            <label>Default air changes</label>
            <div class="fp-unit"><input type="number" step="0.1" min="0" v-model.number="plan.default_ach" @change="commit"><span>/hr</span></div>
            <button class="fp-link" @click="apply_default_ach">Apply to all rooms</button>
          </div>
        </div>

        <h4>Floors</h4>
        <table class="fp-table fp-edit">
          <tr><th>Name</th><th class="num">Ceiling height</th><th></th></tr>
          <tr v-for="l in plan.levels.slice().reverse()" :key="l.id">
            <td><input type="text" v-model="l.name" @change="commit"></td>
            <td class="num"><div class="fp-unit"><input type="number" step="0.05" min="1" v-model.number="l.height" @change="commit"><span>m</span></div></td>
            <td class="fp-x-cell"><button class="fp-x" v-if="plan.levels.length>1" @click="delete_level(l)" title="Delete floor">×</button></td>
          </tr>
        </table>

        <h4>Element types <small class="fp-muted">U-value W/m²K</small></h4>
        <table class="fp-table fp-edit">
          <tr v-for="(t,name) in plan.element_type" :key="name">
            <td><input type="text" :value="name" @change="rename_type(name, $event)"></td>
            <td class="num"><input type="number" step="0.01" min="0" v-model.number="t.uvalue" @change="commit"></td>
            <td class="fp-x-cell"><button class="fp-x" @click="delete_type(name)" title="Delete">×</button></td>
          </tr>
        </table>
        <div class="fp-row">
          <button class="fp-link" @click="add_type">+ Add element type</button>
          <select v-model="lib_choice" @change="add_library_type" class="fp-lib">
            <option value="">+ Add typical construction…</option>
            <option v-for="l in library" :key="l.name" :value="l.name">{{ l.label }} ({{ l.uvalue }})</option>
          </select>
        </div>
        <p class="fp-muted">Typical values are a starting point, check them against the <a href="https://mcscertified.com/wp-content/uploads/2020/04/Guidance-on-U-Values-from-Domestic-Heating-Design-Guide.pdf" target="_blank">MCS U-value guidance</a>.</p>

        <h4>Defaults</h4>
        <div class="fp-grid2">
          <div class="fp-field" v-for="(label,key) in {wall_external:'External walls', wall_internal:'Internal walls', wall_party:'Party walls', window:'Windows', door:'Doors', floor_ground:'Ground floors', floor_intermediate:'Between floors', floor_exposed:'Exposed floors', roof:'Roof / top ceiling'}" :key="key">
            <label>{{ label }}</label>
            <select v-model="plan.defaults[key]" @change="commit">
              <option v-for="t in element_type_names" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
        </div>

        <h4>Plan</h4>
        <div class="fp-grid3">
          <div class="fp-field">
            <label>North</label>
            <div class="fp-unit"><input type="number" step="15" v-model.number="plan.north" @change="commit"><span>°</span></div>
          </div>
          <div class="fp-field">
            <label>Snap grid</label>
            <select v-model.number="plan.grid" @change="commit">
              <option :value="0.01">1 cm</option>
              <option :value="0.05">5 cm</option>
              <option :value="0.1">10 cm</option>
              <option :value="0.25">25 cm</option>
              <option :value="0.5">50 cm</option>
            </select>
          </div>
          <div class="fp-field">
            <label>Max wall gap</label>
            <div class="fp-unit"><input type="number" step="0.05" min="0" v-model.number="plan.wall_gap" @change="commit"><span>m</span></div>
          </div>
        </div>
        <div class="fp-grid3">
          <div class="fp-field">
            <label>External walls</label>
            <div class="fp-unit"><input type="number" step="0.01" min="0" v-model.number="plan.wall_thickness.external" @change="commit"><span>m</span></div>
          </div>
          <div class="fp-field">
            <label>Party walls</label>
            <div class="fp-unit"><input type="number" step="0.01" min="0" v-model.number="plan.wall_thickness.party" @change="commit"><span>m</span></div>
          </div>
        </div>
        <p class="fp-muted">Rooms closer than the max wall gap share a wall, and the gap is that wall's thickness. External and party walls are drawn outwards at these thicknesses unless set on the wall. Floor and ceiling over a wall on the floor above or below is not counted as exposed. North can also be set by dragging the compass.</p>
      </div>

      <!-- ============================== Results ============================== -->
      <div class="fp-panel" v-if="tab=='results' && calc">
        <div class="fp-results-head">
          <div><span>Heat loss at {{ plan.T.external }}°C</span><b>{{ fmt(calc.house.heatloss) }} W</b></div>
          <div><span>Annual heating demand</span><b>{{ fmt(calc.house.kwh) }} kWh</b></div>
          <div><span>Floor area</span><b>{{ fmt(calc.house.total_area,1) }} m²</b></div>
          <div><span>Heat loss per m²</span><b>{{ calc.house.total_area>0 ? fmt(calc.house.heatloss/calc.house.total_area) : '-' }} W/m²</b></div>
        </div>

        <ul class="fp-warnings" v-if="analysis.warnings.length">
          <li v-for="(w,i) in analysis.warnings" :key="i">{{ w }}</li>
        </ul>

        <h4>Rooms</h4>
        <table class="fp-table fp-clickable">
          <tr><th>Room</th><th class="num">°C</th><th class="num">m²</th><th class="num">W</th><th class="num">W/m²</th><th class="num" v-if="has_radiators">Emitters</th></tr>
          <tr v-for="r in heated_rooms" :key="r.id" @click="goto_room(r)" v-if="room_calc(r)">
            <td>{{ r.name }} <small class="fp-muted" v-if="plan.levels.length>1">{{ level_name(r.level) }}</small></td>
            <td class="num">{{ r.temperature }}</td>
            <td class="num">{{ fmt(room_calc(r).area,1) }}</td>
            <td class="num"><b>{{ fmt(room_calc(r).heat) }}</b></td>
            <td class="num">{{ fmt(room_wm2(r)) }}</td>
            <td class="num" v-if="has_radiators" :class="room_calc(r).total_heat_output>=room_calc(r).heat-1 ? 'ok' : 'short'">{{ fmt(room_calc(r).total_heat_output) }}</td>
          </tr>
        </table>

        <h4>Building fabric</h4>
        <table class="fp-table">
          <tr><td>Total volume</td><td class="num">{{ fmt(calc.house.total_volume,1) }} m³</td></tr>
          <tr><td>External boundary area</td><td class="num">{{ fmt(calc.house.total_external_boundary_area,1) }} m²</td></tr>
          <tr><td>Unheated boundary area</td><td class="num">{{ fmt(calc.house.total_unheated_boundary_area,1) }} m²</td></tr>
          <tr><td>Ground boundary area</td><td class="num">{{ fmt(calc.house.total_ground_boundary_area,1) }} m²</td></tr>
          <tr><td>Internal heat balance <small class="fp-muted">(should be zero)</small></td><td class="num">{{ fmt(calc.house.internal_heat_balance) }} W</td></tr>
        </table>

        <h4>Heat pump</h4>
        <div class="fp-grid2">
          <div class="fp-field">
            <label>Mean water temperature</label>
            <div class="fp-unit"><input type="number" step="0.5" v-model.number="plan.heating_MWT" @change="commit"><span>°C</span></div>
          </div>
          <div class="fp-field">
            <label>Flow rate</label>
            <div class="fp-unit"><input type="number" step="0.5" v-model.number="plan.heatpump_flow_rate" @change="commit"><span>L/min</span></div>
          </div>
          <div class="fp-field">
            <label>COP calculation</label>
            <select v-model="plan.cop_calculation_method" @change="commit">
              <option value="carnot">Carnot COP equation</option>
              <option value="ecodan">EcoDan lookup table</option>
            </select>
          </div>
          <div class="fp-field" v-if="plan.cop_calculation_method=='ecodan'">
            <label>Heat pump capacity</label>
            <div class="fp-unit"><input type="number" step="0.5" v-model.number="plan.heatpump_capacity" @change="commit"><span>kW</span></div>
          </div>
        </div>
        <table class="fp-table" v-if="has_radiators">
          <tr><td>Emitter output at MWT</td><td class="num">{{ fmt(calc.house.total_heat_output) }} W</td></tr>
          <tr><td>Flow temperature</td><td class="num">{{ fmt(calc.heatpump_flow_temperature,1) }} °C</td></tr>
          <tr><td>COP</td><td class="num">{{ fmt(calc.heatpump_COP,2) }}</td></tr>
          <tr><td>Electric input</td><td class="num">{{ fmt(calc.heatpump_elec) }} W</td></tr>
        </table>
        <p class="fp-muted" v-else>Add radiators or underfloor heating to rooms to see emitter output and heat pump COP.</p>
      </div>
    </aside>
  </div>

  <datalist id="fp-room-names">
    <option>Living room</option><option>Kitchen</option><option>Dining room</option><option>Hall</option>
    <option>Landing</option><option>Bedroom 1</option><option>Bedroom 2</option><option>Bedroom 3</option>
    <option>Bathroom</option><option>En-suite</option><option>WC</option><option>Study</option><option>Utility</option>
  </datalist>
</div>
</script>

<script type="text/javascript" src="heatlossjs/ecodan.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="heatlossjs/calc.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="heatlossjs/floorplan_model.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="heatlossjs/floorplan.js?v=<?php echo $v; ?>"></script>
</body>
</html>
