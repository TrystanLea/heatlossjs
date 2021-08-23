var config = {
  degreedays: 2228,
  heating_MWT: 40.0,
  
  T: {
    external: -3.0,
    ground: 10.0,
    unheated: 10.0
  },

  element_type: {
    "Floor:Ground": { uvalue:0.68 },
    "Floor:First": { uvalue:1.7 },
    "Floor:Loft": { uvalue:0.22 },
    "Wall:External": { uvalue:1.7 },
    "Wall:ExternalIWI": { uvalue:0.73 },
    "Wall:Internal": { uvalue:1.7 },
    "Glazing:Secondary": { uvalue:2.8 },
    "Door:Front": { uvalue:1.6 },
    "Door:Back": { uvalue:3.2 }
  },
  
  rooms: {
   "livingroom":{
      temperature: 21.0,
      width: 2.59, 
      length: 5.43, 
      height: 2.43,
      air_change_an_hour: 1.5,
   
      elements: [
        {
          type:"Wall:ExternalIWI", 
          orientation:"Front", 
          width:2.59, height:2.43
        },
        {
          type:"Wall:ExternalIWI", 
          orientation:"Right", 
          width:5.43, height:2.43
        },
        {
          type:"Wall:ExternalIWI", 
          orientation:"Back", 
          width:2.59, height:2.43
        },
        { 
          type:"Wall:Internal", 
          orientation:"Left", 
          width:5.43, height:2.43,
          boundary:'kitchen'
        },
        { 
          type:"Floor:Ground", 
          width:2.59, height:5.43,
          boundary:'ground'
        },
        { 
          type:"Floor:First",
          width:2.59, height:5.43,
          boundary:'bed2'
        },
        {
          type:"Glazing:Secondary",
          subtractfrom:0,
          width:0.92, height:1.4
        },
        {
          type:"Glazing:Secondary",
          subtractfrom:2,
          width:0.8, height:1.22
        },
        {
          type:"Glazing:Secondary",
          subtractfrom:1,
          width:0.66, height:1.08
        },
        {
          type:"Glazing:Secondary",
          subtractfrom:1,
          width:0.66, height:1.08
        }
      ],

      radiators: [
          {name:"Double Panel Convector 1200x600",heat50k:2146},
          {name:"Double Panel Convector 1200x600",heat50k:2146}
      ],
      ufh:[]
    },
      
   "kitchen":{
      temperature: 18.0,
      width: 4.25, length: 4.18, height: 2.43,
      air_change_an_hour: 2.0,
      
      elements: [
        {
          type:"Wall:ExternalIWI", 
          orientation:"Front", 
          width:4.25, height:2.43
        },
        {
          type:"Wall:ExternalIWI", 
          orientation:"Left", 
          width:4.18, height:2.43
        },
        { 
          type:"Wall:Internal", 
          orientation:"Back", 
          width:4.25, height:2.43,
          boundary:'larder&porch'
        },
        { 
          type:"Wall:Internal", 
          orientation:"Right", 
          width:4.18, height:2.43,
          boundary:'livingroom'
        },
        { 
          type:"Floor:Ground", 
          width:4.25, height:4.18,
          boundary:'ground'
        },
        { 
          type:"Floor:First",
          width:4.25, height:4.18,
          boundary:'bed2'
        },
        {
          type:"Glazing:Secondary",
          subtractfrom:0,
          width:0.92, height:1.4
        },
        {
          type:"Door:Front",
          subtractfrom:0,
          width:0.95, height:2.28
        }
      ],
      
      radiators: [
          {name:"Double Panel Convector 1200x600",heat50k:2146},
          {name:"Double Panel Convector 1200x600",heat50k:2146}
      ],
      ufh:[]
    },
    
   "larder&porch":{
      temperature: 17.0,
      width: 4.27, 
      length: 1.21, 
      height: 2.43,
      air_change_an_hour: 2.0,
      
      elements: [
        {
          type:"Wall:External", 
          orientation:"Back", 
          width:4.27, height:2.43
        },
        {
          type:"Wall:External", 
          orientation:"Left", 
          width:1.21, height:2.43
        },
        {
          type:"Glazing:Secondary",
          subtractfrom:0,
          width:0.8, height:1.22
        },
        {
          type:"Door:Front",
          subtractfrom:0,
          width:0.9, height:2.2
        },
        { 
          type:"Wall:Internal", 
          orientation:"Right", 
          width:1.21, height:2.43,
          boundary:'livingroom'
        },
        { 
          type:"Wall:Internal", 
          orientation:"Front", 
          width:4.25, height:2.43,
          boundary:'kitchen'
        },
        { 
          type:"Floor:Ground", 
          width:4.27, height:1.21,
          boundary:'ground'
        },
        { 
          type:"Floor:First",
          width:4.27, height:1.21,
          boundary:'bathroom'
        }
      ],
      ufh:[]
    },
    
   "bed1":{
      temperature: 18.0,
      width: 4.24, length: 2.74, height: 2.34,
      air_change_an_hour: 1.0,
      
      elements: [
        {
          type:"Wall:ExternalIWI", 
          orientation:"Front", 
          width:4.24, height:2.34
        },
        {
          type:"Wall:Internal", 
          orientation:"Left", 
          width:2.74, height:2.34,
          boundary:'bed2'
        },
        {
          type:"Wall:Internal", 
          orientation:"Back", 
          width:4.24, height:2.34,
          boundary:'bed3'
        },
        {
          type:"Wall:ExternalIWI", 
          orientation:"Right", 
          width:2.74, height:2.34
        },
        { 
          type:"Floor:First", 
          width:4.4, height:2.74,
          boundary:'livingroom'
        },
        { 
          type:"Floor:Loft",
          width:4.4, height:2.74
        },
        {
          type:"Glazing:Secondary",
          subtractfrom:0,
          width:0.96, height:1.24
        },
        {
          type:"Glazing:Secondary",
          subtractfrom:0,
          width:0.96, height:1.24
        }
      ],
      
      radiators: [{name:"Double Panel Convector 1200x400",heat50k:1528}],
      ufh:[]
    },
    
   "bed2":{
      temperature: 18.0,
      width: 2.54, length: 2.92, height: 2.34,
      air_change_an_hour: 1.0,
      
      elements: [
        {
          type:"Wall:ExternalIWI", 
          orientation:"Front", 
          width:2.54, height:2.34
        },
        {
          type:"Wall:ExternalIWI", 
          orientation:"Left", 
          width:2.92, height:2.34
        },
        {
          type:"Wall:Internal", 
          orientation:"Back", 
          width:4.24, height:2.34,
          boundary:'bathroom'
        },
        {
          type:"Wall:Internal", 
          orientation:"Right", 
          width:2.74, height:2.34,
          boundary:'bed1'
        },
        { 
          type:"Floor:First", 
          width:4.4, height:2.74,
          boundary:'kitchen'
        },
        { 
          type:"Floor:Loft",
          width:4.4, height:2.74
        },
        {
          type:"Glazing:Secondary",
          subtractfrom:0,
          width:0.96, height:1.24
        }
      ],
      
      radiators: [{name:"Double Panel Convector 1000x400",heat50k:1273}],
      ufh:[]
    },
    
   "bed3":{
      temperature:18.0,
      width: 2.59, length: 2.55, height: 2.34,
      air_change_an_hour: 1.0,
      
      elements: [
        {
          type:"Wall:Internal", 
          orientation:"Front", 
          width:2.59, height:2.34,
          boundary:'bed1'
        },
        {
          type:"Wall:Internal", 
          orientation:"Left", 
          width:2.55, height:2.34,
          boundary:'landing'
        },
        {
          type:"Wall:ExternalIWI", 
          orientation:"Back", 
          width:2.59, height:2.34
        },
        {
          type:"Wall:ExternalIWI", 
          orientation:"Right", 
          width:2.55, height:2.34
        },
        { 
          type:"Floor:First", 
          width:2.59, height:2.55,
          boundary:'livingroom'
        },
        { 
          type:"Floor:Loft",
          width:2.59, height:2.55,
        },
        {
          type:"Glazing:Secondary",
          subtractfrom:2,
          width:0.77, height:1.21
        }
      ],
      
      radiators: [{name:"Double Panel Convector 1000x400",heat50k:1273}],
      ufh:[]
    },
    
   "landing":{
      temperature:18.0,
      width: 1.53, length: 3.4, height: 2.34,
      air_change_an_hour: 2.0,
      
      elements: [
        {
          type:"Wall:Internal", 
          orientation:"Front", 
          width:1.53, height:2.34,
          boundary:'bed1'
        },
        {
          type:"Wall:Internal", 
          orientation:"Left", 
          width:3.4, height:2.34,
          boundary:'bathroom'
        },
        {
          type:"Wall:ExternalIWI", 
          orientation:"Back", 
          width:1.53, height:2.34
        },
        {
          type:"Wall:Internal", 
          orientation:"Right", 
          width:3.4, height:2.34,
          boundary:'bed3'
        },
        { 
          type:"Floor:First", 
          width:1.53, height:3.4,
          boundary:'kitchen'
        },
        { 
          type:"Floor:Loft",
          width:1.53, height:3.4,
        },
        {
          type:"Glazing:Secondary",
          subtractfrom:2,
          width:0.77, height:1.21
        }
      ]
    },
    
   "bathroom":{
      temperature:22.0,
      width: 2.54, length: 2.38, height: 2.34,
      air_change_an_hour: 3.0,
      
      elements: [
        {
          type:"Wall:Internal", 
          orientation:"Front", 
          width:2.54, height:2.34,
          boundary:'bed1'
        },
        {
          type:"Wall:ExternalIWI", 
          orientation:"Left", 
          width:2.38, height:2.34,
        },
        {
          type:"Wall:ExternalIWI", 
          orientation:"Back", 
          width:2.54, height:2.34
        },
        {
          type:"Wall:Internal", 
          orientation:"Right", 
          width:2.38, height:2.34,
          boundary:'landing'
        },
        { 
          type:"Floor:First", 
          width:2.54, height:2.38,
          boundary:'kitchen'
        },
        { 
          type:"Floor:Loft",
          width:2.54, height:2.38,
        },
        {
          type:"Glazing:Secondary",
          subtractfrom:2,
          width:0.77, height:1.21
        }
      ],

      radiators: [{name:"Double Panel Convector 800x600", heat50k:1430}],
      ufh:[]
    }
  }
};
