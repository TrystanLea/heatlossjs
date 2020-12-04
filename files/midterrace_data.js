var config = {
  degreedays: 2228,
  heating_MWT: 40.0,
  
  T: {
    external: -3.0,
    ground: 10.0,
    unheated: 10.0
  },

  element_type: {
    "Floor:Ground": { uvalue:1.0 },
    "Floor:InsulatedGround": { uvalue:0.32 },
    "Floor:First": { uvalue:1.7 },
    "Floor:Loft": { uvalue:0.18 },
    "Wall:External": { uvalue:1.7 },
    "Wall:Internal": { uvalue:1.7 },
    "Wall:Party": { uvalue:0.5 },
    "Glazing:Double": { uvalue:3.1 }
  },
  
  rooms: {
   "livingroom":{
      temperature: 21.0,
      width: 3.4, 
      length: 6.8, 
      height: 2.4,
      air_change_an_hour: 1.5,
   
      elements: [
        {
          type:"Wall:External", 
          orientation:"South", 
          width:3.4, height:2.4
        },
        { 
          type:"Wall:Party", 
          orientation:"West", 
          width:6.8, height:2.4,
          boundary:'unheated'
        },
        { 
          type:"Wall:External", 
          orientation:"North", 
          width:1.6, height:2.4
        },
        { 
          type:"Wall:Internal", 
          orientation:"East", 
          width:6.8, height:2.4,
          boundary:'hall'
        },
        { 
          type:"Floor:InsulatedGround", 
          width:6.8, height:3.4,
          boundary:'ground'
        },
        { 
          type:"Floor:First",
          width:6.8, height:3.4,
          boundary:'bed2'
        },
        {
          type:"Glazing:Double",
          subtractfrom:0,
          width:1.8, height:1.6
        },
        {
          type:"Glazing:Double",
          subtractfrom:2,
          width:1.0, height:1.5
        }
      ],

      radiators: [
          {name:"Double Panel Convector 1200x600"},
          {name:"Double Panel Convector 1200x600"},
          {name:"Double Panel Convector 1200x600"}
          //{name:"Dimplex SmartRad SRX180 Fan:2, 300L/h"}
      ]
    },
    
   "hall":{
      temperature: 18.0,
      width: 1.0, 
      length: 6.8, 
      height: 2.4,
      air_change_an_hour: 2.0,
      
      elements: [
        {
          type:"Wall:External", 
          orientation:"South", 
          width:1.0, height:2.4
        },
        { 
          type:"Wall:Internal", 
          orientation:"West", 
          width:6.8, height:2.4,
          boundary:'livingroom'
        },
        { 
          type:"Wall:Internal", 
          orientation:"North", 
          width:1.0, height:2.4,
          boundary:'livingroom'
        },
        { 
          type:"Wall:Party", 
          orientation:"East", 
          width:6.8, height:2.4,
          boundary:'unheated'
        },
        { 
          type:"Floor:Ground", 
          width:6.8, height:1.0,
          boundary:'ground'
        },
        { 
          type:"Floor:First",
          width:6.8, height:1.0,
          boundary:'study'
        },
        {
          type:"Glazing:Double",
          subtractfrom:0,
          width:0.8, height:1.9
        }
      ],
      
      radiators: [{name:"Double Panel Convector 1200x600"}]
    },
    
   "kitchen":{
      temperature: 18.0,
      width: 2.4, length: 3.0, height: 2.4,
      air_change_an_hour: 2.0,
      
      elements: [
        { 
          type:"Wall:Internal", 
          orientation:"South", 
          width:2.4, height:2.4,
          boundary:'livingroom'
        },
        { 
          type:"Wall:External", 
          orientation:"West", 
          width:3.0, height:2.4
        },
        { 
          type:"Wall:External", 
          orientation:"North", 
          width:2.4, height:2.4
        },
        { 
          type:"Wall:Party", 
          orientation:"East", 
          width:3.0, height:2.4,
          boundary:'unheated'
        },
        { 
          type:"Floor:Ground", 
          width:3.0, height:2.4,
          boundary:'ground'
        },
        { 
          type:"Floor:First",
          width:3.0, height:2.4,
          boundary:'bathroom'
        },
        {
          type:"Glazing:Double",
          subtractfrom:1,
          width:0.9, height:1.3
        },
        {
          type:"Glazing:Double",
          subtractfrom:1,
          width:0.8, height:1.9
        }
      ],
      
      radiators: []
    },
    
   "bed1":{
      temperature: 18.0,
      width: 3.0, length: 3.5, height: 2.4,
      air_change_an_hour: 1.0,
      
      elements: [
        { 
          type:"Wall:Internal", 
          orientation:"South", 
          width:3.0, height:2.4,
          boundary:'bed2'
        },
        { 
          type:"Wall:Party", 
          orientation:"West", 
          width:3.5, height:2.4,
          boundary:'unheated'
        },
        { 
          type:"Wall:External", 
          orientation:"North", 
          width:1.6, height:2.4
        },
        { 
          type:"Wall:Internal", 
          orientation:"North", 
          width:1.4, height:2.4,
          boundary:'bathroom'
        },
        { 
          type:"Wall:Internal", 
          orientation:"East", 
          width:3.5, height:2.4,
          boundary:'landing'
        },
        { 
          type:"Floor:First", 
          width:3.0, height:3.5,
          boundary:'livingroom'
        },
        { 
          type:"Floor:Loft",
          width:3.0, height:3.5
        },
        {
          type:"Glazing:Double",
          subtractfrom:2,
          width:0.9, height:1.3
        }
      ],
      
      radiators: [{name:"Double Panel Convector 1200x500"}]
    },
    
   "bed2":{
      temperature: 18.0,
      width: 2.6, length: 3.2, height: 2.4,
      air_change_an_hour: 1.0,
      
      elements: [
        { 
          type:"Wall:External", 
          orientation:"South", 
          width:2.6, height:2.4
        },
        { 
          type:"Wall:Party", 
          orientation:"West", 
          width:3.2, height:2.4,
          boundary:'unheated'
        },
        { 
          type:"Wall:Internal", 
          orientation:"North", 
          width:2.6, height:2.4,
          boundary:'bed1'
        },
        { 
          type:"Wall:Internal", 
          orientation:"East", 
          width:3.2, height:2.4,
          boundary:'landing'
        },
        { 
          type:"Floor:First", 
          width:2.6, height:3.2,
          boundary:'livingroom'
        },
        { 
          type:"Floor:Loft",
          width:2.6, height:3.2
        },
        {
          type:"Glazing:Double",
          subtractfrom:"32",
          width:0.9, height:1.3
        }
      ],
      
      radiators: [{name:"Double Panel Convector 1200x500"}]
    },
    
   "study":{
      temperature:21.0,
      width: 1.8, length: 2.2, height: 2.4,
      air_change_an_hour: 1.5,
      
      elements: [
        { 
          type:"Wall:External", 
          orientation:"South", 
          width:1.8, height:2.4
        },
        { 
          type:"Wall:Internal", 
          orientation:"West", 
          width:2.2, height:2.4,
          boundary:'bed2'
        },
        { 
          type:"Wall:Internal", 
          orientation:"North", 
          width:1.8, height:2.4,
          boundary:'bed1'
        },
        { 
          type:"Wall:Party", 
          orientation:"East", 
          width:2.2, height:2.4,
          boundary:'unheated'
        },
        { 
          type:"Floor:First", 
          width:1.8, height:2.2,
          boundary:'livingroom'
        },
        { 
          type:"Floor:Loft",
          width:1.8, height:2.2
        },
        {
          type:"Glazing:Double",
          subtractfrom:0,
          width:0.8, height:1.4
        }
      ],
      
      radiators: [{name:"Double Panel Convector 1000x400"}]
    },
    
   "landing":{
      temperature:18.0,
      width: 1.5, length: 4.4, height: 2.4,
      air_change_an_hour: 2.0,
      
      elements: [
        { 
          type:"Wall:Internal", 
          orientation:"South", 
          width:1.5, height:2.4,
          boundary:'study'
        },
        { 
          type:"Wall:Internal", 
          orientation:"West", 
          width:4.4, height:2.4,
          boundary:'bed1'
        },
        { 
          type:"Wall:Internal", 
          orientation:"North", 
          width:1.5, height:2.4,
          boundary:'bathroom'
        },
        { 
          type:"Wall:Party", 
          orientation:"East", 
          width:4.4, height:2.4,
          boundary:'unheated'
        },
        { 
          type:"Floor:First", 
          width:1.5, height:4.4,
          boundary:'hall'
        },
        { 
          type:"Floor:Loft",
          width:1.5, height:4.4
        }
      ]
    },
    
   "bathroom":{
      temperature:22.0,
      width: 2.4, length: 3.3, height: 2.4,
      air_change_an_hour: 3.0,
      
      elements: [
        { 
          type:"Wall:Internal", 
          orientation:"South", 
          width:2.4, height:2.4,
          boundary:'landing'
        },
        { 
          type:"Wall:External", 
          orientation:"West", 
          width:3.3, height:2.4
        },
        { 
          type:"Wall:External", 
          orientation:"North", 
          width:2.4, height:2.4
        },
        { 
          type:"Wall:Party",
          orientation:"East",
          width:3.3, height:2.4,
          boundary:'unheated'
        },
        { 
          type:"Floor:First", 
          width:2.4, height:3.3,
          boundary:'kitchen'
        },
        { 
          type:"Floor:Loft",
          width:2.4, height:3.3
        },
        {
          type:"Glazing:Double",
          subtractfrom:2,
          width:0.8, height:0.9
        }
      ],
      
      radiators: [
          //{name:"Dimplex SmartRad SRX180 Fan:2, 300L/h"},
          {name:"Double Panel Convector 800x600"}
      ]
    }
  },
    
  radiators:{
      "Single Panel Convector 1200x400":{heat50k:875, incvat:42},
      "Double Panel Convector 600x400":{heat50k:764, incvat:42},
      "Double Panel Convector 800x400":{heat50k:1018, incvat:42},
      "Double Panel Convector 1000x400":{heat50k:1273, incvat:69},
      "Double Panel Convector 1100x400":{heat50k:1400, incvat:70},
      "Double Panel Convector 1200x400":{heat50k:1528, incvat:79},

      "Double Panel Convector 1200x500":{heat50k:1834, incvat:84},
      "Double Panel Convector 1000x500":{heat50k:1528, incvat:84},
      
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
};
