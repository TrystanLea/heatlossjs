// --------------------------------------------------------------------------------------------
// HeatLoss Model JS Library
// Author: Trystan Lea
// Licence: GPL
// --------------------------------------------------------------------------------------------
var heatloss = {
    element: "",
    path: "heatlossjs"
}

// --------------------------------------------------------------------------------------------
// Init
// --------------------------------------------------------------------------------------------
heatloss.init = function(element) {
    this.element = element
    this.events()
    
    config.path = this.path
        
    // Load template
    $.ajax({
      url: this.path+'/template.html',
      cache: true,
      success: function(data) {
        source = data;
        heatloss.template  = Handlebars.compile(source);
        heatloss.calculate()
      }               
    });
}

// --------------------------------------------------------------------------------------------
// Calculation
// --------------------------------------------------------------------------------------------
heatloss.calculate = function() {
    config.path = this.path

    var air_change_factor = 0.33

    config.house = {
        heatloss: 0,
        kwh: 0,
        total_heat_output: 0
    };
    
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
            if (e.type=="Floor:First") e.kwh = 0
            else if (e.type=="Wall:Internal") e.kwh = 0
            else if (e.type=="Wall:Party") e.kwh = 0
            
            room.wk += e.wk
            room.heat += e.heat
            room.kwh += e.kwh
            room.A += e.A
            
            if (e.boundary=='external') config.house.wk += e.wk
            if (e.boundary=='unheated') config.house.wk += e.wk
            if (e.boundary=='ground') config.house.wk += e.wk
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
    }
    
    // Heat pump model
    var heatpump_deltaT = config.house.total_heat_output / ((config.heatpump_flow_rate / 60)*4150)
    config.heatpump_flow_temperature = config.heating_MWT + 0.5*heatpump_deltaT;
    config.heatpump_COP = 0.49 * (config.heatpump_flow_temperature+4+273) / ((config.heatpump_flow_temperature+4+273)-(config.T.external-6+273));
    
    $(this.element).html(this.template(config));
}

// --------------------------------------------------------------------------------------------
// Events
// --------------------------------------------------------------------------------------------
heatloss.events = function() {

    // ------------------------------------------------------
    // Element types
    // ------------------------------------------------------

    $(this.element).on('click',".add-element-type",function(){

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
        heatloss.calculate();
    });

    $(this.element).on('change',".element-type-name",function(){
        var old_name = $(this).attr("name");
        var new_name = $(this).val();
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
        
        heatloss.calculate();
    });
    
    $(this.element).on('change',".element-type-uvalue",function(){
        var name = $(this).attr("name");
        var value = $(this).val();
        config.element_type[name].uvalue = value;
        heatloss.calculate();
    });

    // ------------------------------------------------------
    // Misc
    // ------------------------------------------------------
    
    $(this.element).on('change',".boundaries",function(){
        var boundary = $(this).attr("boundary");
        var value = $(this).val();
        config.T[boundary] = value;
        heatloss.calculate();
    });
    
    $(this.element).on('change',".MWT",function(){
        config.heating_MWT = $(this).val()*1;
        heatloss.calculate();
    });

    $(this.element).on('change',".degreedays",function(){
        config.degreedays = $(this).val()*1;
        heatloss.calculate();
    });
    
    $(this.element).on('change',".heatpump_flow_rate",function(){
        config.heatpump_flow_rate = $(this).val()*1;
        heatloss.calculate();
    });

    // ------------------------------------------------------
    // Rooms
    // ------------------------------------------------------

    $(this.element).on('click',".add-new-room",function(){
        var n=0; for (var z in config.rooms) n++;
        config.rooms["Room "+n] = {
          temperature: 20.0, area: 0.0, height: 0.0, air_change_an_hour: 1.0,
          elements: [],
          radiators: []
        }
        heatloss.calculate()
    });

    $(this.element).on('change',".room-input",function(){
        var room = $(this).attr("room");
        var property = $(this).attr("prop")
        var value = $(this).val() * 1
        config.rooms[room][property] = value
        heatloss.calculate()
    });
    
    $(this.element).on('change',".room-name",function(){
        var old_room_name = $(this).attr("room");
        var new_room_name = $(this).val()
        config.rooms[new_room_name] = JSON.parse(JSON.stringify(config.rooms[old_room_name]))
        delete config.rooms[old_room_name]
        heatloss.calculate()
    });
    
    $(this.element).on('click',".room-heading",function(){
       var roomName = $(this).attr("name");
       $(".room-elements[name='"+roomName+"']").slideToggle(); 
    });

    // ------------------------------------------------------
    // Element
    // ------------------------------------------------------

    $(this.element).on('click',".add-element",function(){
        var roomName = $(this).attr("room");
        var length = config.rooms[roomName].elements.length;

        if (length>0) {
            var last = config.rooms[roomName].elements[length-1]
            config.rooms[roomName].elements.push(JSON.parse(JSON.stringify(last)))
        } else {
            config.rooms[roomName].elements.push({
                type:Object.keys(config.element_type)[0],
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
       config.rooms[room].elements.splice(elementIndex,1)
       heatloss.calculate();
    });

    $(this.element).on('change',".element",function(){
        var tr = $(this).parent().parent();
        var room = tr.attr("room");
        var elementIndex = tr.attr("element");
        var property = $(this).attr("prop");
        var value = $(this).val();
        
        if (property=="width" || property=="height") {
            value = value * 1;
            delete config.rooms[room].elements[elementIndex].area
        }
        else if (property=="area") {
            value = value * 1;
        }
        
        config.rooms[room].elements[elementIndex][property] = value;
        
        // console.log(room+" "+elementIndex+" "+property+" "+value)
        
        heatloss.calculate();
    });

    // ------------------------------------------------------
    // Radiators
    // ------------------------------------------------------

    $(this.element).on('click',".add-radiator",function(){
        var roomName = $(this).attr("room");
        var length = config.rooms[roomName].radiators.length;

        if (length>0) {
            var last = config.rooms[roomName].radiators[length-1]
            config.rooms[roomName].radiators.push(last)
        } else {
            config.rooms[roomName].radiators.push({
                name:"Double Panel Convector 1200x600",
                heat50k:2146
            });
        }
        heatloss.calculate();
    });
    $(this.element).on('click',".delete-radiator",function(){
       var tr = $(this).parent().parent();
       var room = tr.attr("room");
       var radiatorIndex = tr.attr("radiatorIndex");
       config.rooms[room].radiators.splice(radiatorIndex,1)
       heatloss.calculate();
    });
    
    $(this.element).on('change',".radiator",function(){
        var tr = $(this).parent().parent();
        var room = tr.attr("room");
        var radiatorIndex = tr.attr("radiatorIndex");
        var property = $(this).attr("prop");
        var value = $(this).val();
        
        config.rooms[room].radiators[radiatorIndex][property] = value;
        
        heatloss.calculate();
    });
    
    // ------------------------------------------------------
    // Radiators
    // ------------------------------------------------------

    $(this.element).on('click',".add-ufh",function(){
        var roomName = $(this).attr("room");
        var length = config.rooms[roomName].ufh.length;

        if (length>0) {
            var last = config.rooms[roomName].ufh[length-1]
            config.rooms[roomName].ufh.push(last)
        } else {
            config.rooms[roomName].ufh.push({
                name:"16mm diameter, 150mm spacing",
                area:config.rooms[roomName].area,
                flooring:0.00
            });
        }
        heatloss.calculate();
    });
    $(this.element).on('click',".delete-ufh",function(){
       var tr = $(this).parent().parent();
       var room = tr.attr("room");
       var ufhIndex = tr.attr("ufhIndex");
       config.rooms[room].ufh.splice(ufhIndex,1)
       heatloss.calculate();
    });
    
    $(this.element).on('change',".ufh",function(){
        var tr = $(this).parent().parent();
        var room = tr.attr("room");
        var ufhIndex = tr.attr("ufhIndex");
        var property = $(this).attr("prop");
        var value = $(this).val();
        
        config.rooms[room].ufh[ufhIndex][property] = value;
        
        heatloss.calculate();
    });
    
    $(this.element).on('click',".save",function(){
        download_data("heatlossjs.json",JSON.stringify(config, null, 2))
    });
    
    $(this.element).on('change',"#open",function(e){
        open_file(e)
    });
    
    $(this.element).on('click',".new",function(e){
        config = JSON.parse(JSON.stringify(config_new))
        heatloss.calculate();
    });
}

function open_file(e) {
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = JSON.parse(e.target.result);
    if (contents!=null) config = contents
    heatloss.calculate();
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

function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

Handlebars.registerHelper('ifeq', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('ifmorethan', function(arg1, arg2, options) {
    return (arg1 >= arg2) ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('toFixed', function(value,dp) {
   return value.toFixed(dp);
});
Handlebars.registerHelper('toUpperCase', function(str) {
  return str.toUpperCase();
});
