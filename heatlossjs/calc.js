// =========================================
// HeatLoss.js calculation, operates on the global config object
// Requires ecodan.js for the EcoDan COP lookup
// =========================================

function calculate() {
    
    var air_change_factor = 0.33

    config.house = {
        heatloss: 0,
        kwh: 0,
        total_heat_output: 0,
        internal_heat_balance: 0,
        total_area: 0,
        total_volume: 0,
        total_external_area: 0,
        total_external_boundary_area: 0,
        total_unheated_boundary_area: 0,
        total_ground_boundary_area: 0,
    };
    
    config.JK = 50;
    
    config.heating_MWT *=1;
    if (config.heating_MWT==null || config.heating_MWT=='') config.heating_MWT = 0;
    
    // Pre calculate elements
    for (var z in config.elements) {
        var e = config.elements[z];
        if (e == false) continue;

        if (e.orientation==undefined) e.orientation = "";

        if (e.area!=undefined) {
            e.A = e.area
            e.width = 0;
            e.height = 0;
        } else {
            e.A = e.width * e.height
        }
        
        // Subtract windows and doors from wall and floor elements
        for (var i2 in config.elements) {
            var e2 = config.elements[i2]
            if (e2 == false) continue;
            
            if (e2.subtractfrom==z) {
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
    }
    
    
    for (var z in config.rooms) {
        var room = config.rooms[z]
        
        room.wk = 0
        room.heat = 0
        room.kwh = 0
        room.A = 0

        room.total_external_area = 0;
        room.total_external_boundary_area = 0;
        room.total_unheated_boundary_area = 0;
        room.total_ground_boundary_area = 0;
        
        for (var i in room.elements) {
            var e = room.elements[i]
            if (e == false) continue;
            
            var WK = config.elements[e.id].wk;
            
            // Boundary temperature
            if (e.boundary==undefined) e.boundary = 'external'
            if (config.T[e.boundary]!=undefined) {
                e.temperature = config.T[e.boundary]
            } else if (config.rooms[e.boundary]!=undefined) {
                e.temperature = config.rooms[e.boundary].temperature
            }
            
            e.deltaT = room.temperature - e.temperature
            e.heat = WK * e.deltaT
                        
            e.kwh = WK * config.degreedays * 0.024
            if (e.boundary!='external' && e.boundary!='ground') e.kwh = 0
            
            room.wk += WK
            room.heat += e.heat
            room.kwh += e.kwh
            room.A += config.elements[e.id].A;
            
            if (e.boundary=='external') config.house.wk += WK
            else if (e.boundary=='unheated') config.house.wk += WK
            else if (e.boundary=='ground') config.house.wk += WK
            else if (config.rooms[e.boundary]!=undefined) {
                config.house.internal_heat_balance += e.heat  
            }
            // other custom boundaries e.g heated neighbour
            else config.house.wk += WK

            // Total envelope area
            if (e.boundary=='external') {
                config.house.total_external_area += config.elements[e.id].A
                config.house.total_external_boundary_area += config.elements[e.id].A
                room.total_external_area += config.elements[e.id].A
                room.total_external_boundary_area += config.elements[e.id].A
            }
            // include unhetaed areas
            if (e.boundary=='unheated') {
                config.house.total_external_area += config.elements[e.id].A
                config.house.total_unheated_boundary_area += config.elements[e.id].A
                room.total_external_area += config.elements[e.id].A
                room.total_unheated_boundary_area += config.elements[e.id].A
            }
            // include ground areas
            if (e.boundary=='ground') {
                config.house.total_external_area += config.elements[e.id].A
                config.house.total_ground_boundary_area += config.elements[e.id].A
                room.total_external_area += config.elements[e.id].A
                room.total_ground_boundary_area += config.elements[e.id].A
            }
        }

        // Print to console total room areas
        console.log("Room: "+z+" Area: "+room.A.toFixed(1)+"  Envelope area: "+room.total_external_area.toFixed(1)+" External boundary area: "+room.total_external_boundary_area.toFixed(1)+" Unheated Area: "+room.total_unheated_boundary_area.toFixed(1)+" Ground Area: "+room.total_ground_boundary_area.toFixed(1));

        // ----------------------------------------------------------------------------------------
        // Ventilation and infiltration
        // ----------------------------------------------------------------------------------------
        if (room.area==undefined) room.area = 0;
        
        if (room.width>0 && room.length>0) {
            room.area = room.width * room.length
        }
        room.volume = room.area * room.height

        config.house.total_area += room.area
        config.house.total_volume += room.volume
        
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
        config.heatpump_COP = 0.5 * (config.heatpump_flow_temperature+2+273) / ((config.heatpump_flow_temperature+2+273)-(config.T.external-6+273));
    } else {
        if (config.heatpump_capacity==undefined) config.heatpump_capacity = 5.0;
        config.heatpump_COP = get_ecodan_cop(config.heatpump_flow_temperature,config.T.external,(config.house.total_heat_output*0.001)/config.heatpump_capacity);
    }
    config.heatpump_elec = config.house.total_heat_output / config.heatpump_COP 
}
