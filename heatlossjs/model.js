calculate();

// Load template
$.ajax({
  url: 'heatlossjs/template.html?v=4',
  cache: true,
  async:false,
  success: function(data) {
    $("#heatloss").html(data);
  }               
});

var dynamic_simulation_interval = false;
config.solver_running = false;

var app = new Vue({
    el: '#heatloss',
    data: config,
    methods: {
        update: function() {
            calculate();
            
            if (config.solver_running) {
                clearInterval(dynamic_simulation_interval);
                dynamic_simulation_interval = setInterval(dynamic,100);
            }
        },
        
        focus: function() {
           if (config.solver_running) {
               clearInterval(dynamic_simulation_interval);
           }
        },
        add_element_type: function() {
            var last = false;
            var index = 0;
            for (var name in config.element_type) {
                last = config.element_type[name]
                index++
            }
            if (last!=false) {
                config.element_type["Element "+index] = JSON.parse(JSON.stringify(last))
            } else {
                config.element_type["Element "+index] = {uvalue:0}
            }
            calculate();
        },
        change_element_type_name: function(e,old_name) {
            var new_name = e.target.value;
            // Create new element with new name
            config.element_type[new_name] = config.element_type[old_name]
            // Update all elements with new name
            for (var roomName in config.rooms) {
                for (var elementIndex in config.rooms[roomName].elements) {
                    if (config.rooms[roomName].elements[elementIndex].type==old_name) {
                        config.rooms[roomName].elements[elementIndex].type = new_name
                    }
                }
            }
            // Delete old element
            delete config.element_type[old_name]
            calculate();
        },
        add_new_room: function() {
            var n=0; for (var z in config.rooms) n++;
            config.rooms["Room "+n] = {
                temperature: 20.0, area: 0.0, height: 2.4, air_change_an_hour: 0.5,
                elements: [],
                radiators: []
            }
            calculate(); 
        },
        change_room_name: function(e,old_room_name) {
            var new_room_name = e.target.value;
            config.rooms[new_room_name] = JSON.parse(JSON.stringify(config.rooms[old_room_name]))
            delete config.rooms[old_room_name]
            calculate()      
        },
        toggleSection: function (roomName) {
            $(".room-elements[name="+roomName+"]").slideToggle(); 
        },
        add_element: function(roomName) {
            var length = config.rooms[roomName].elements.length;

            if (length>0) {
                var copy = JSON.parse(JSON.stringify(config.rooms[roomName].elements[length-1]));
                delete copy.linked_element;
                config.rooms[roomName].elements.push(copy)
                app.generate_link(roomName,config.rooms[roomName].elements.length-1);
            } else {
                config.rooms[roomName].elements.push({
                    type:Object.keys(config.element_type)[0],
                    orientation:"", 
                    width:config.rooms[roomName].width,
                    height: config.rooms[roomName].height
                });
            }
            calculate();   
        },
        
        update_element: function(roomName,elementIndex, field) {
            
            // Update linked element
            if (config.rooms[roomName].elements[elementIndex].linked_element!=undefined) {
                var linked_room = config.rooms[roomName].elements[elementIndex].linked_room;
                var linked_element = config.rooms[roomName].elements[elementIndex].linked_element;
                config.rooms[linked_room].elements[linked_element][field] = config.rooms[roomName].elements[elementIndex][field]
            }
            
            app.update();
        },
        
        delete_element: function(roomName,elementIndex) {
            app.delete_link(roomName,elementIndex);
            config.rooms[roomName].elements.splice(elementIndex,1)
            calculate();       
        },
        update_boundary: function(roomName,elementIndex) {
            app.delete_link(roomName,elementIndex);
            app.generate_link(roomName,elementIndex);
            calculate();
        },
        delete_link: function(roomName,elementIndex) {
            if (config.rooms[roomName].elements[elementIndex]!=undefined) {
                if (config.rooms[roomName].elements[elementIndex].linked_element!=undefined) {
                    var linked_room = config.rooms[roomName].elements[elementIndex].linked_room;
                    var linked_element = config.rooms[roomName].elements[elementIndex].linked_element;
                    config.rooms[linked_room].elements.splice(linked_element,1)
                    delete config.rooms[roomName].elements[elementIndex].linked_room;
                    delete config.rooms[roomName].elements[elementIndex].linked_element;
                }
            }
        },
        generate_link: function(roomName,elementIndex) {
            var boundary = config.rooms[roomName].elements[elementIndex].boundary;
            if (boundary!="ground" && boundary!="unheated" && boundary!="external") {
                if (config.rooms[roomName].elements[elementIndex].linked_element==undefined) {
                    var copy = JSON.parse(JSON.stringify(config.rooms[roomName].elements[elementIndex]));
                    copy.boundary = roomName;
                    copy.linked_room = roomName;
                    copy.linked_element = elementIndex;
                    config.rooms[boundary].elements.push(copy);
                    
                    config.rooms[roomName].elements[elementIndex].linked_room = boundary;
                    config.rooms[roomName].elements[elementIndex].linked_element = config.rooms[boundary].elements.length-1;
                }
            }
        },
        add_radiator: function(roomName) {
            var length = config.rooms[roomName].radiators.length;

            if (length>0) {
                var last = config.rooms[roomName].radiators[length-1]
                config.rooms[roomName].radiators.push(JSON.parse(JSON.stringify(last)))
            } else {
                config.rooms[roomName].radiators.push({
                    name:"Double Panel Convector 1200x600",
                    heat50k:2146
                });
            }
            calculate();       
        },
        delete_radiator: function(roomName,radiatorIndex) {
            config.rooms[roomName].radiators.splice(radiatorIndex,1)
            calculate();
        },
        add_ufh: function(roomName) {
            var length = config.rooms[roomName].ufh.length;

            if (length>0) {
                var last = config.rooms[roomName].ufh[length-1]
                config.rooms[roomName].ufh.push(JSON.parse(JSON.stringify(last)))
            } else {
                config.rooms[roomName].ufh.push({
                    name:"16mm diameter, 150mm spacing",
                    area:config.rooms[roomName].area,
                    flooring:0.00
                });
            }
            calculate();      
        },
        delete_ufh: function(roomName,ufhIndex) {
            config.rooms[roomName].ufh.splice(ufhIndex,1)
            calculate();
        },
        file_new: function() {
            for (var z in config_new) {
                config[z] = JSON.parse(JSON.stringify(config_new[z]))
            }
            calculate();
        },
        file_open: function(e) {
            open_file(e)
        },
        file_save: function() {
        
            // Filter out computed properties
            var filtered_config = JSON.parse(JSON.stringify(config));           
            /*
            for (var z in filtered_config.rooms) {
                for (var i in filtered_config.rooms[z].elements) {
                    delete filtered_config.rooms[z].elements[i].A;
                    delete filtered_config.rooms[z].elements[i].uvalue;
                    delete filtered_config.rooms[z].elements[i].wk;
                    delete filtered_config.rooms[z].elements[i].deltaT;
                    delete filtered_config.rooms[z].elements[i].heat;
                    delete filtered_config.rooms[z].elements[i].kwh;
                }
                delete filtered_config.rooms[z].wk;
                delete filtered_config.rooms[z].heat;
                delete filtered_config.rooms[z].kwh;
                delete filtered_config.rooms[z].A;
                delete filtered_config.rooms[z].area;
            }*/
    
            var date = new Date();
            var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            var h = date.getHours();
            if (h<10) h = "0"+h;
            var m = date.getMinutes();
            if (m<10) m = "0"+m; 
            var datestr = date.getDate()+months[date.getMonth()]+h+m
            download_data("heatlossjs_"+config.project_name+"_"+datestr+".json",JSON.stringify(filtered_config, null, 2))
        },
        open_in_sapjs: function() {
            localStorage.setItem("heatlossjs",JSON.stringify(config));
            window.location = "/sapjs?load=heatlossjs"
        },
        start_solver: function() {
            dynamic_simulation_interval = setInterval(dynamic,100);
            config.solver_running = true;
        },
        stop_solver: function() {
            clearInterval(dynamic_simulation_interval);
            config.solver_running = false;
        }
    },
    
    filters: {
        toFixed: function(val,dp) {
            if (isNaN(val)) {
                return val;
            } else {
                if (val==null) return 0;
                return val.toFixed(dp)
            }
        },
        toUpperCase: function(val) {
            return val.toUpperCase();
        }
    }
});

function calculate() {
    
    var air_change_factor = 0.33

    config.house = {
        heatloss: 0,
        kwh: 0,
        total_heat_output: 0,
        internal_heat_balance: 0,
    };
    
    config.JK = 50;
    
    config.heating_MWT *=1;
    if (config.heating_MWT==null || config.heating_MWT=='') config.heating_MWT = 0;
    
    for (var z in config.rooms) {
        var room = config.rooms[z]
        
        room.wk = 0
        room.heat = 0
        room.kwh = 0
        room.A = 0
        
        for (var i in room.elements) {
            var e = room.elements[i]
            if (e.orientation==undefined) e.orientation = ""
            
            // Boundary temperature
            if (e.boundary==undefined) e.boundary = 'external'
            if (config.T[e.boundary]!=undefined) {
                e.temperature = config.T[e.boundary]
            } else if (config.rooms[e.boundary]!=undefined) {
                e.temperature = config.rooms[e.boundary].temperature
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
            e.uvalue = config.element_type[e.type].uvalue
            e.wk = e.A * e.uvalue
            e.deltaT = room.temperature - e.temperature
            e.heat = e.wk * e.deltaT
                        
            e.kwh = e.wk * config.degreedays * 0.024
            if (e.boundary!='external' && e.boundary!='ground') e.kwh = 0
            
            room.wk += e.wk
            room.heat += e.heat
            room.kwh += e.kwh
            room.A += e.A
            
            if (e.boundary=='external') config.house.wk += e.wk
            else if (e.boundary=='unheated') config.house.wk += e.wk
            else if (e.boundary=='ground') config.house.wk += e.wk
            else {
                config.house.internal_heat_balance += e.heat  
            }    
        }

        // ----------------------------------------------------------------------------------------
        // Ventilation and infiltration
        // ----------------------------------------------------------------------------------------
        if (room.area==undefined) room.area = 0;
        
        if (room.width>0 && room.length>0) {
            room.area = room.width * room.length
        }
        room.volume = room.area * room.height
        
        var deltaT = room.temperature - config.T.external
        
        var infiltration_wk = room.air_change_an_hour * air_change_factor * room.volume
        room.wk += infiltration_wk
        config.house.wk += infiltration_wk
        
        room.infiltration_heat = infiltration_wk * deltaT
        room.heat += room.infiltration_heat
        
        var infiltration_kwh = infiltration_wk * config.degreedays * 0.024
        room.kwh += infiltration_kwh
        
        // ----------------------------------------------------------------------------------------
        // Radiators
        // ----------------------------------------------------------------------------------------
        room.total_radiator_output = 0;
        
        if (room.radiators==undefined) room.radiators = [];
        
        for (var i in room.radiators) {
           var rad = room.radiators[i]
           
           if (rad.model==undefined) rad.model="pow"
           if (rad.heat50k==undefined) rad.heat50k = 1000
           
           if (rad.model=="pow") {
               var dT = config.heating_MWT - room.temperature
               rad.heat = rad.heat50k * Math.pow((dT / 50),1.3)
           } else if (rad.model=="linear") {
               rad.heat = rad.m * config.heating_MWT + rad.c
           }
           
           room.total_radiator_output += rad.heat
        }
        
        // ----------------------------------------------------------------------------------------
        // Under floor heating
        // ----------------------------------------------------------------------------------------
        room.total_ufh_output = 0;
        
        if (room.ufh==undefined) room.ufh = [];
        
        for (var i in room.ufh) {
           var ufh = room.ufh[i]
           
           if (ufh.flooring==undefined) ufh.flooring = 0
           
           var dT = config.heating_MWT - room.temperature

           // parameters determined using curve fitting of MCS heat pump calculator data
           var m = 86.7*Math.pow(ufh.flooring,2) - 31.543*ufh.flooring + 5.74385;
           var c = 424.7*Math.pow(ufh.flooring,2) - 156.403*ufh.flooring + 28.70185;
           
           var heat_m2 = (m * dT) - c;
           if (heat_m2<0) heat_m2 = 0;
           
           ufh.heat = heat_m2 * ufh.area;

           room.total_ufh_output += ufh.heat
        }
        
        room.total_heat_output = room.total_radiator_output + room.total_ufh_output
        
        config.house.heatloss += room.heat
        config.house.kwh += room.kwh
        config.house.total_heat_output += room.total_heat_output
        
        if (room.energy==undefined) room.energy = room.temperature * config.JK;
        room.energy += ( -room.heat + room.total_heat_output) * 0.01
    }
    
    // Heat pump model
    var heatpump_deltaT = config.house.total_heat_output / ((config.heatpump_flow_rate / 60)*4150)
    config.heatpump_flow_temperature = config.heating_MWT + 0.5*heatpump_deltaT;
    
    if (config.cop_calculation_method==undefined) {
        config.cop_calculation_method = "ecodan";
    }
    
    if (config.cop_calculation_method=="carnot") {
        config.heatpump_COP = 0.49 * (config.heatpump_flow_temperature+4+273) / ((config.heatpump_flow_temperature+4+273)-(config.T.external-6+273));
    } else {
        if (config.heatpump_capacity==undefined) config.heatpump_capacity = 5.0;
        config.heatpump_COP = get_ecodan_cop(config.heatpump_flow_temperature,config.T.external,(config.house.total_heat_output*0.001)/config.heatpump_capacity);
    }
    config.heatpump_elec = config.house.total_heat_output / config.heatpump_COP 
}

// dynamic_simulation_interval = setInterval(dynamic,100);

function dynamic() {
  calculate()
  for (var z in config.rooms) {
      config.rooms[z].temperature = config.rooms[z].energy / config.JK;
  }
}



function open_file(e) {
  console.log(e)
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = JSON.parse(e.target.result);
    if (contents!=null) {
        for (var z in contents) {
            config[z] = JSON.parse(JSON.stringify(contents[z]))
        }
        calculate();
    }
  };
  reader.readAsText(file);
}

function download_data(filename, data) {
    var blob = new Blob([data], {type: 'application/json'});
    if(window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else{
        var elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;        
        document.body.appendChild(elem);
        elem.click();        
        document.body.removeChild(elem);
    }
}

