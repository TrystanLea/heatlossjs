// --------------------------------------------------------------------------------------------
// HeatLoss Model JS Library
// Author: Trystan Lea
// Licence: GPL
// --------------------------------------------------------------------------------------------
var heatloss = {
    element: "",
    path: "heatlossjs",
    
    degreedays:2228,
    MWT:40
}

// --------------------------------------------------------------------------------------------
// Init
// --------------------------------------------------------------------------------------------
heatloss.init = function(element) {
    this.element = element
    this.calculate()
    this.events()
}

// --------------------------------------------------------------------------------------------
// Calculation
// --------------------------------------------------------------------------------------------
heatloss.calculate = function() {
    var air_change_factor = 0.33

    var house = {
        heatloss: 0,
        kwh: 0,
        radiator_output: 0
    };
    
    for (var z in rooms) {
        var room = rooms[z]
        
        room.wk = 0
        room.heat = 0
        room.kwh = 0
        room.A = 0
        
        for (var i in room.elements) {
            var e = room.elements[i]
            if (e.orientation==undefined) e.orientation = ""
            
            // Boundary temperature
            if (e.boundary==undefined) e.boundary = 'external'
            if (T[e.boundary]!=undefined) {
                e.temperature = T[e.boundary]
            } else if (rooms[e.boundary]!=undefined) {
                e.temperature = rooms[e.boundary].temperature
            }
            
            if (e.area!=undefined) {
                e.A = e.area
                e.width = 0;
                e.height = 0;
            } else {
                e.A = e.width * e.height
            }
            
            // Subtract windows and doors from wall and floor elements
            for (var i2 in room.elements) {
                var e2 = room.elements[i2]
                if (e2.subtractfrom==i) {
                    if (e2.area!=undefined) {
                        e2.A = e2.area
                    } else {
                        e2.A = e2.width * e2.height
                    }
                    e.A -= e2.A
                }
            }
            
            // Calculate: heat loss rate, deltaT and heat loss
            e.wk = e.A * element_type[e.type].uvalue
            e.deltaT = room.temperature - e.temperature
            e.heat = e.wk * e.deltaT
            
            e.kwh = e.wk * this.degreedays * 0.024
            if (e.type=="Floor:First") e.kwh = 0
            else if (e.type=="Wall:Internal") e.kwh = 0
            else if (e.type=="Wall:Party") e.kwh = 0
            
            room.wk += e.wk
            room.heat += e.heat
            room.kwh += e.kwh
            room.A += e.A
            
            if (e.boundary=='external') house.wk += e.wk
            if (e.boundary=='unheated') house.wk += e.wk
            if (e.boundary=='ground') house.wk += e.wk
        }

        // ----------------------------------------------------------------------------------------
        // Ventilation and infiltration
        // ----------------------------------------------------------------------------------------
        if (room.area!=undefined) {
            room.volume = room.area * room.height
            room.width = 0
            room.length = 0
            
        } else {
            room.volume = room.width * room.length * room.height
        }
        var deltaT = room.temperature - T.external
        
        var infiltration_wk = room.air_change_an_hour * air_change_factor * room.volume
        room.wk += infiltration_wk
        house.wk += infiltration_wk
        
        room.infiltration_heat = infiltration_wk * deltaT
        room.heat += room.infiltration_heat
        
        var infiltration_kwh = infiltration_wk * this.degreedays * 0.024
        room.kwh += infiltration_kwh
        
        // ----------------------------------------------------------------------------------------
        // Radiators
        // ----------------------------------------------------------------------------------------
        room.total_radiator_output = 0;
        
        if (room.radiators==undefined) room.radiators = [];
        
        for (var i in room.radiators) {
           var r = room.radiators[i]
           
           if (radiators[r.name].model==undefined) radiators[r.name].model="pow"
           
           if (radiators[r.name].model=="pow") {
               var dT = this.MWT - room.temperature
               r.heat50k = radiators[r.name].heat50k
               r.heat = radiators[r.name].heat50k * Math.pow((dT / 50),1.3)
           } else if (radiators[r.name].model=="linear") {
               r.heat = radiators[r.name].m * this.MWT + radiators[r.name].c
           }
           
           room.total_radiator_output += r.heat
        }
        
        house.heatloss += room.heat
        house.kwh += room.kwh
        house.radiator_output += room.total_radiator_output;
    }
    
    // --------------------------------------------------------------------------------------------
    // Draw
    // --------------------------------------------------------------------------------------------
    var out = "";
    
    // --------------------------------------------------------------------------------------------
    // Element U-values
    // --------------------------------------------------------------------------------------------
    out += "<div class='section'>";
    out += "<div class='section-heading'><b>Element Types</div>";
    
    out += "<div class='room-elements'>";
    
    // --------------------------------------------------------------------------------------------
    out += "<div style='width:49%; float:left'>";
    out += "<table>";
    out += "<tr><th>Element Name</th><th>U-value</th></tr>";
    
    for (var elementName in element_type) {
        out += "<tr>";
        out += "<td>"+elementName+"</td>";
        out += "<td style='width:120px'><input class='element-types' style='width:60%' name='"+elementName+"' type='text' value='"+element_type[elementName].uvalue+"'/><span class='unit'>W/K.m2</span></td>";
        out += "</tr>";
    }
    out += "</table>";
    out += "</div>";
    // --------------------------------------------------------------------------------------------
    out += "<div style='width:50%; float:right'>";
    out += "<table style='margin-bottom:5px'>";
    out += "<tr><th>Boundary</th><th>Temperature</th></tr>";
    
    for (var boundary in T) {
        out += "<tr>";
        out += "<td>"+boundary+"</td>";
        out += "<td style='width:120px'><input class='boundaries' style='width:60%' boundary='"+boundary+"' type='text' value='"+T[boundary]+"'/><span class='unit'>C</span></td>";
        out += "</tr>";
    }
    out += "</table>";
    out += "</div>";
    
    out += "<div style='width:50%; float:right'>";
    out += "<table>";
    out += "<tr><th>Other</th><th>Value</th></tr>";

    out += "<tr>";
    out += "<td>Radiator Mean Water Temperature (MWT)</td>";
    out += "<td style='width:120px'><input class='MWT' style='width:60%' type='text' value='"+this.MWT+"'/><span class='unit'>C</span></td>";
    out += "</tr>";

    out += "</table>";
    out += "</div>";
    // --------------------------------------------------------------------------------------------
    out += "<div style='clear:both'></div>";
    
    out += "</div>";
    out += "</div>";
    
    
    for (var roomName in rooms) {
        var room = rooms[roomName]
        
        out += "<div class='room'>";
        out += "<div class='room-heading' name='"+roomName+"'><b>Room: "+ucFirst(roomName)+"</b> "+Math.round(room.heat)+"W "+Math.round(room.kwh)+" kWh</div>";
        
        out += "<div class='room-elements' name='"+roomName+"'>";
        
        out += "<table style='margin-bottom:5px'>";
        out += "<tr><td>Room set point:</td><td><input class='room-input' room='"+roomName+"' prop=temperature type='text' value='"+room.temperature+"'/></td>";
        out += "<td>Air changes per hour:</td><td><input class='room-input' room='"+roomName+"' prop=air_change_an_hour type='text' value='"+room.air_change_an_hour.toFixed(1)+"'/></td></tr>";
        out += "</table>";

        out += "<table style='margin-bottom:5px'><tr><td>Room</td>";
        out += "<td style='text-align:right'>Width:</td>";
        out += "<td style='width:65px'><input class='room-input' type='text' room='"+roomName+"' prop=width value='"+room.width+"'/><span class='unit'>m</span></td>";
        out += "<td style='text-align:right'>Length:</td>";
        out += "<td style='width:65px'><input class='room-input' type='text' room='"+roomName+"' prop=length value='"+room.length+"'/><span class='unit'>m</span></td>";
        out += "<td style='text-align:right'>Height:</td>";
        out += "<td style='width:65px'><input class='room-input' type='text' room='"+roomName+"' prop=height value='"+room.height+"'/><span class='unit'>m</span></td>";
        out += "<td style='text-align:right'>Volume:</td><td><div class='value'>"+room.volume.toFixed(1)+"</div><span class='unit'>m3</span></td>";
        out += "<td style='text-align:right'><b>Heat loss:</b></td><td><div class='value'>"+Math.round(room.infiltration_heat)+"</div><span class='unit'>W</span></td>";
        out += "</tr></table>";
        
        out += "<table class='room-elements-table' style='margin-bottom:5px'>";
        
        // <th>Ext Temp</th><th>DeltaT</th>
        out += '<tr><th>ID</th><th width="200px">Type</th><th>Boundary</th><th></th><th width="100px">Orientation</th><th width="50px">Width</th><th width="50px">Height</th><th>Area</th><th>U-value</th><th>Heat loss</th></tr>';
        
        var total_heatloss = 0
        var total_kwh = 0
        var total_room_surface_area = 0
        
        for (var elementIndex in room.elements) {
            var e = room.elements[elementIndex]
            
            out += "<tr room='"+roomName+"' element='"+elementIndex+"'>";
            
            out += "<td>"+elementIndex+"</td>";
            
            // ELEMENT TYPE
            // out += "<td><input class='element' prop='type' type='text' value='"+e.type+"'/></td>";
            out += "<td><select class='element' prop='type'>";
            for (var z in element_type) {
                if (z==e.type) selected = 'selected'; else selected = '';
                out += "<option "+selected+">"+z+"</option>";
            }
            out += "</select></td>";
            
            // ELEMENT BOUNDARY
            // out += "<td><div class='value'>"+e.boundary.toUpperCase()+"</div></td>";
            out += "<td><select class='element' prop='boundary'>";
            for (var z in T) {
                if (z.toUpperCase()==e.boundary.toUpperCase()) selected = 'selected'; else selected = '';
                out += "<option "+selected+">"+z.toUpperCase()+"</option>";
            }
            for (var z in rooms) {
                if (z.toUpperCase()==e.boundary.toUpperCase()) selected = 'selected'; else selected = '';
                out += "<option "+selected+">"+z.toUpperCase()+"</option>";
            }
            out += "</select></td>";
            
            // SUBTRACT FROM
            out += "<td><select class='element' prop='subtractfrom'>";
            out += "<option></option>";
            for (var z in room.elements) {
                if (z==e.subtractfrom) selected = 'selected'; else selected = '';
                out += "<option "+selected+">"+z+"</option>";
            }
            out += "</select></td>";
            
            out += "<td><input class='element' prop='orientation' type='text' value='"+e.orientation+"'/></td>";
            out += "<td><input class='element' prop='width' type='text' value='"+e.width.toFixed(1)+"'/><span class='unit'>m</span></td>";
            out += "<td><input class='element' prop='height' type='text' value='"+e.height.toFixed(1)+"'/><span class='unit'>m</span></td>";
            out += "<td><div class='value'>"+e.A.toFixed(1)+"</div><span class='unit'>m2</span></td>"
            out += "<td><div class='value'>"+element_type[e.type].uvalue+"</span></td>";
            //out += "<td><div class='value'>"+e.wk.toFixed(1)+"</div><span class='unit'>W/K</span></td>";
            //out += "<td><div class='value'>"+e.temperature+"</div><span class='unit'>C</span></td>";
            //out += "<td><div class='value'>"+e.deltaT.toFixed(1)+"</div><span class='unit'>K</span></td>";
            out += "<td><div class='value'>"+e.heat.toFixed(0)+"</div><span class='unit'>W</span></td>";
            out += "<td class='center'><img src='"+this.path+"/glyphicons-17-bin.png' class='icon delete-element' /></td>";
            out += "</tr>";
        }
        
        out += "<tr><td></td><td><div class='add-element' room='"+roomName+"'><img src='"+this.path+"/glyphicons-191-plus-sign.png' class='icon' />Add Element</div></td></tr>";
        
        out += "</table>";
        
        out += "<table style='margin-bottom:5px'>";
        out += "<tr><td>Total room heat loss:</td><td style='width:120px'>"+Math.round(room.heat)+"W</td></tr>";
        out += "</table>";
        
        out += "<br><b>Radiators</b>";
        
        out += "<table class='room-radiators-table'>";
        
        for (var i in room.radiators) {
            var r = room.radiators[i]
            
            out += "<tr room='"+roomName+"' radiatorIndex='"+i+"'>";
            
            out += "<td><select class='radiator' prop='name'>";
            for (var z in radiators) {
                if (z==r.name) selected = 'selected'; else selected = '';
                var heat50k = ""; if (radiators[z].heat50k!=undefined) heat50k = " ("+radiators[z].heat50k+"W @50K)";
                var incvat = ""; if (radiators[z].incvat!=undefined) incvat = " £"+radiators[z].incvat;
                out += "<option "+selected+" value='"+z+"'>"+z+heat50k+incvat+"</option>";
            }
            out += "</select></td>"
            out += "<td style='width:120px'><div class='value'>"+Math.round(r.heat)+"</div><span class='unit'>W</span></td>";
            out += "</tr>";
        }
        
        if (room.radiators.length) {
            var bgcolor = "#e3a4a4"; if (room.total_radiator_output>=room.heat) bgcolor = "#aee3a4";
            out += "<tr><td></td><td style='background-color:"+bgcolor+"'>"+Math.round(room.total_radiator_output)+"W</td></tr>";
        }
        
        out += "</table>";
        
        out += "</div>";
        out += "</div>";
    }
    
    // --------------------------------------------------------------------------------------------
    // Totalhouse
    // --------------------------------------------------------------------------------------------
    out += "<div class='section'>";
    out += "<div class='section-heading'><b>House Totals</b></div>";
    
    out += "<div class='room-elements'>";
    out += "<table>";
    out += "<tr><td>Annual space heating demand:</td><td><div class='value'>"+Math.round(house.kwh)+"</div><span class='unit'>kWh</span></td></tr>";
    out += "<tr><td>Maximum heat requirement:</td><td><div class='value'>"+Math.round(house.heatloss)+"</div><span class='unit'>W</span></td></tr>";
    out += "<tr><td>Total radiator output</td><td><div class='value'>"+Math.round(house.radiator_output)+"</div><span class='unit'>W</span></td></tr>";
    out += "</table>";
    out += "</div>";
    out += "</div>";
    
    $(this.element).html(out);
}

// --------------------------------------------------------------------------------------------
// Events
// --------------------------------------------------------------------------------------------
heatloss.events = function() {

    $(this.element).on('change',".element-types",function(){
        var name = $(this).attr("name");
        var value = $(this).val();
        element_type[name].uvalue = value;
        heatloss.calculate();
    });
    
    $(this.element).on('change',".boundaries",function(){
        var boundary = $(this).attr("boundary");
        var value = $(this).val();
        T[boundary] = value;
        heatloss.calculate();
    });
    
    $(this.element).on('change',".MWT",function(){
        heatloss.MWT = $(this).val();
        heatloss.calculate();
    });

    $(this.element).on('change',".room-input",function(){
        var room = $(this).attr("room");
        var property = $(this).attr("prop")
        var value = $(this).val() * 1
        rooms[room][property] = value
        heatloss.calculate()
    });

    $(this.element).on('change',".element",function(){
        var tr = $(this).parent().parent();
        var room = tr.attr("room");
        var elementIndex = tr.attr("element");
        var property = $(this).attr("prop");
        var value = $(this).val();
        
        if (property=="width" || property=="height") value = value * 1;
        if (property=="boundary") value = value.toLowerCase();
        
        rooms[room].elements[elementIndex][property] = value;
        
        heatloss.calculate();
    });

    $(this.element).on('change',".radiator",function(){
        var tr = $(this).parent().parent();
        var room = tr.attr("room");
        var radiatorIndex = tr.attr("radiatorIndex");
        var property = $(this).attr("prop");
        var value = $(this).val();
        
        rooms[room].radiators[radiatorIndex][property] = value;
        
        heatloss.calculate();
    });

    $(this.element).on('click',".room-heading",function(){
       var roomName = $(this).attr("name");
       $(".room-elements[name='"+roomName+"']").slideToggle(); 
    });

    $(this.element).on('click',".add-element",function(){
        var roomName = $(this).attr("room");
        var length = rooms[roomName].elements.length;

        if (length>0) {
            var last = rooms[roomName].elements[length-1]
            rooms[roomName].elements.push(last)
        } else {
            rooms[roomName].elements.push({
                type:"Wall:External", 
                orientation:"", 
                width:0.0, height:0.0
            });
        }
        heatloss.calculate();
    });

    $(this.element).on('click',".delete-element",function(){
       var tr = $(this).parent().parent();
       var room = tr.attr("room");
       var elementIndex = tr.attr("element");
       rooms[room].elements.splice(elementIndex,1)
       heatloss.calculate();
    });
}

function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


var radiators = {
    "Single Panel Convector 1200x400":{heat50k:875, incvat:42},
    "Double Panel Convector 600x400":{heat50k:764, incvat:42},
    "Double Panel Convector 800x400":{heat50k:1018, incvat:42},
    "Double Panel Convector 1000x400":{heat50k:1273, incvat:69},
    "Double Panel Convector 1100x400":{heat50k:1400, incvat:70},
    "Double Panel Convector 1200x400":{heat50k:1528, incvat:79},

    "Double Panel Convector 1200x500":{heat50k:1834, incvat:84},
    
    "Double Panel Convector 800x600":{heat50k:1430, incvat:53},
    "Double Panel Convector 1000x600":{heat50k:1788, incvat:62},
    "Double Panel Convector 1200x600":{heat50k:2146, incvat:69},
    "Double Panel Convector 1400x600":{heat50k:2503, incvat:113},
    "Double Panel Convector 1600x600":{heat50k:2861, incvat:120},
    "Double Panel Convector 1800x600":{heat50k:3218, incvat:143},

    "Double Panel Convector 1200x700":{heat50k:2407, incvat:110},

    "Cast Iron 1200x700x160":{heat50k:1600},
    "Cast Iron 1200x600x160":{heat50k:1500},
    "Cast Iron 1200x400x160":{heat50k:1400},
    
    "Dimplex SmartRad SRX180 Fan:3, 300L/h":{model:"linear", m:102.34, c:-2104.10, incvat:334},
    "Dimplex SmartRad SRX180 Fan:2, 300L/h":{model:"linear", m:69.49, c:-1413.75, incvat:334},
    "Dimplex SmartRad SRX180 Fan:1, 300L/h":{model:"linear", m:42.05, c:-847.75, incvat:334}
}
