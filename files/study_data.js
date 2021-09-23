var config = {
  project_name: "study",
  
  degreedays: 2228,
  heating_MWT: 40.0,
  
  T: {
    external: -3.0,
    ground: 10.0,
    unheated: 10.0
  },

  element_type: {
    "Ground Floor": { uvalue:0.7 },
    "Insulated Roof": { uvalue:0.6 },
    "Stone Wall 0.70m": { uvalue:1.3 },
    "Stone Wall 2.00m": { uvalue:0.5 },
    "Timber Frame Wall": { uvalue:0.6 },
    "Single Glazing": { uvalue:4.8 },
    "Door": { uvalue:3.2 }
  },
  
  rooms: {
   "Study":{
      temperature: 18.0,
      area:33.68,
      height: 2.15,
      air_change_an_hour: 1.5,
   
      elements: [
        {
          type:"Single Glazing", 
          orientation:"Front", 
          width:5.04, height:1.98
        },
        {
          type:"Single Glazing", 
          orientation:"Front Left", 
          width:0.80, height:1.98
        },
        {
          type:"Stone Wall 0.70m", 
          orientation:"Left", 
          width:4.47, height:2.15
        },
        {
          type:"Timber Frame Wall", 
          orientation:"Back", 
          width:1.67, height:2.15
        },
        {
          type:"Timber Frame Wall", 
          orientation:"Back Left", 
          width:2.08, height:1.885
        },
        {
          type:"Timber Frame Wall", 
          orientation:"Back", 
          width:3.76, height:0.72
        },
        {
          type:"Stone Wall 0.70m", 
          orientation:"Back", 
          width:3.76, height:0.9
        },
        {
          type:"Stone Wall 0.70m", 
          orientation:"Back", 
          width:0.67, height:1.62
        },
        {
          type:"Stone Wall 0.70m", 
          orientation:"Back Right", 
          width:1.25, height:1.885
        },
        {
          type:"Stone Wall 2.00m", 
          orientation:"Right", 
          width:0.56, height:2.15
        },
        {
          type:"Stone Wall 0.70m", 
          orientation:"Right", 
          width:2.20, height:2.15
        },
        {
          type:"Stone Wall 2.00m", 
          orientation:"Right", 
          width:1.90, height:2.15
        },
        {
          type:"Door", 
          orientation:"Right", 
          width:0.81, height:2.10
        },
        {
          type:"Ground Floor", 
          orientation:"", 
          area:33.68,
          boundary:'ground'
        },
        {
          type:"Insulated Roof", 
          orientation:"", 
          area:33.68
        }
      ],

      radiators: [
          {name:"Cast Iron 1200x600x160",heat50k:1500},
          {name:"Double Panel Convector 1200x600",heat50k:2146},
          {name:"Double Panel Convector 1200x600",heat50k:2146},
          {name:"Double Panel Convector 1200x500",heat50k:1834},
          {name:"Double Panel Convector 1200x500",heat50k:1834}
      ]
    }
  }
};
