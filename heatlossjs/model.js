// =========================================
var heatlossjs_version = 3;
// =========================================

var template = "";

calculate();

// Load template
$.ajax({
    url: 'heatlossjs/template.html?v='+cachev,
    cache: true,
    async: true,
    success: function(data) {
        template = data;
        load_app();
    }               
});

var dynamic_simulation_interval = false;
config.solver_running = false;

var app = {};

function load_app() {
    $("#heatloss").html(template);
    app = new Vue({
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
                    // Find closest element that is not false
                    var id = false;
                    for (var i=length-1; i>=0; i--) {
                        if (config.rooms[roomName].elements[i]!=false) {
                            id = config.rooms[roomName].elements[i].id;
                            break;
                        }
                    }
                    config.elements.push({
                        type: config.elements[id].type,
                        orientation: config.elements[id].orientation,
                        width: config.elements[id].width,
                        height: config.elements[id].height
                    });
                } else {
                    config.elements.push({
                        type:Object.keys(config.element_type)[0],
                        orientation:"", 
                        width:config.rooms[roomName].width,
                        height: config.rooms[roomName].height
                    });
                }
                
                var elementIndex = config.elements.length - 1;
                config.rooms[roomName].elements.push({
                    id: elementIndex, 
                    boundary: 'external'
                }); 
                
                calculate();   
            },
            
            delete_element: function(roomName,elementIndex) {
                var e = config.rooms[roomName].elements[elementIndex]
                
                // Remove the base element
                config.elements[e.id] = false;
                // Remove this element
                config.rooms[roomName].elements[elementIndex] = false;
                // Remove the linked room entry
                if (e.link!=undefined) {
                    config.rooms[e.boundary].elements[e.link] = false;
                }
                         
                calculate();
            },
            update_boundary: function(event,roomName,elementIndex) {
                var e = config.rooms[roomName].elements[elementIndex];
                var o = { boundary: e.boundary };
                
                // Assign new boundary 
                e.boundary = event.target.value
                
                // Remove linked element from original boundary
                if (o.boundary != "external" && o.boundary != "unheated" && o.boundary != "ground") {  
                    if (e.link!=undefined) {
                        config.rooms[o.boundary].elements[e.link] = false;
                    }
                }

                // Only link if another room
                if (e.boundary != "external" && e.boundary != "unheated" && e.boundary != "ground") {                
                    // Add link 
                    config.rooms[e.boundary].elements.push({id: e.id, link: elementIndex, boundary: roomName});
                    e.link = config.rooms[e.boundary].elements.length - 1;
                }
                calculate();
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
    
        var tmp = contents;
        // Translate old formats
        if (tmp.elements == undefined) {
            alert("old format, attempting conversion...");
            tmp = upgrade_file(tmp);
        }
        

        config = JSON.parse(JSON.stringify(tmp))
        
        calculate();
        load_app();
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

function upgrade_file(tmp) {

    tmp.elements = [];
    
    tmp.solver_running = false;
    if (tmp.heatpump_flow_rate == undefined) {
        tmp.heatpump_flow_rate = 12;
    }
    
    for (var room in tmp.rooms) {
        for (var z in tmp.rooms[room].elements) {
        
            let e = tmp.rooms[room].elements[z]
            if (e == false) {
                tmp.elements.push(false)
                tmp.rooms[room].elements[z] = false;
                continue;
            }
            
            let new_element = {
                type: e.type,
                orientation: e.orientation,
                width: e.width,
                height: e.height
            };
            
            if (new_element.width==null || new_element.height == null) {
                new_element.area = e.area
            }
            
            if (e.subtractfrom != undefined && tmp.rooms[room].elements[e.subtractfrom] != undefined) {
                let e2 = tmp.rooms[room].elements[e.subtractfrom];
                if (e2.id != undefined) {
                    new_element.subtractfrom = e2.id;
                }
            }
            
            // Auto link
            var link_element_exists = false;
            var link_element_id = false;
            
            if (e.boundary == undefined) {
                e.boundary = "external";
            }
            
            if (e.boundary != "external" && e.boundary != "unheated" && e.boundary != "ground") {
            
                if (tmp.rooms[e.boundary]==undefined) {
                    console.log(e.boundary);
                }
            
            
                for (var x in tmp.rooms[e.boundary].elements) {
                    let le = tmp.rooms[e.boundary].elements[x];
                    if (le.boundary != undefined && le.boundary == room) {
                        if (le.id != undefined) {
                            var match = true;
                            if (tmp.elements[le.id].width != e.width) match = false;
                            if (tmp.elements[le.id].height != e.height) match = false;
                            if (tmp.elements[le.id].type != e.type) match = false;
                            if (match) {
                                link_element_exists = true;
                                link_element_id = le.id;
                                break;
                            }
                        }
                    }
                }
            }
            
            var element_id = false;
            if (!link_element_exists) {
                // Create new element
                tmp.elements.push(new_element);
                element_id = tmp.elements.length - 1;
            } else {
                element_id = link_element_id;
                tmp.elements[element_id].orientation = '';
            }
            
            // Overwrite with elements reference
            tmp.rooms[room].elements[z] = {
                id: element_id,
                boundary: e.boundary 
            }
        }
    }
    
    return tmp;
}

