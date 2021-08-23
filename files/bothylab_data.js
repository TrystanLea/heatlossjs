var config = {
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
    "Stone Wall 0.85m": { uvalue:1.1 },
    "Stone Wall 0.65m": { uvalue:1.3 },
    "Timber Frame Wall": { uvalue:0.6 },
    "Secondary Glazing": { uvalue:2.8 },
    "Double Glazing": { uvalue:1.6 },
    "Door": { uvalue:2.8 }
  },
  
  rooms: {
   "Old Bothy":{
      temperature: 18.0,
      area:21.04,
      height: 3.36,
      air_change_an_hour: 1.5,
   
      elements: [
        {
          type:"Stone Wall 0.85m", 
          orientation:"Front", 
          width:5.46, height:2.36
        },
        {
          type:"Stone Wall 0.85m", 
          orientation:"Back", 
          width:5.46, height:2.36
        },
        {
          type:"Stone Wall 0.85m", 
          orientation:"Left", 
          width:6.55, height:3.36
        },
        {
          type:"Stone Wall 0.85m", 
          orientation:"Right External", 
          area:4.0
        },
        {
          type:"Stone Wall 0.85m", 
          orientation:"Right Party", 
          area:9.3,
          boundary:'New Bothy'
        },
        {
          type:"Ground Floor", 
          orientation:"", 
          area:21.04,
          boundary:'ground'
        },
        {
          type:"Insulated Roof", 
          orientation:"", 
          area:26.86
        },
        {
          type:"Secondary Glazing", 
          orientation:"SouthEast", 
          area:0.9,
          subtractfrom:0
        },
        {
          type:"Secondary Glazing", 
          orientation:"SouthEast", 
          area:0.9,
          subtractfrom:0
        },
        {
          type:"Door", 
          orientation:"SouthEast", 
          area:1.6,
          subtractfrom:0
        },
        {
          type:"Double Glazing", 
          orientation:"SouthEast", 
          area:0.51,
          subtractfrom:6
        },
        {
          type:"Double Glazing", 
          orientation:"NorthWest", 
          area:0.76,
          subtractfrom:6
        }
      ],

      radiators: [
          {name:"Double Panel Convector 1000x500",heat50k:1528},
          {name:"Double Panel Convector 1000x500",heat50k:1528},
          {name:"Double Panel Convector 1200x700",heat50k:2407},
          {name:"Dimplex SmartRad SRX180 Fan:3, 300L/h",model:"linear", m:102.34, c:-2104.10}
      ]
    },
    
   "New Bothy":{
      temperature: 18.0,
      area: 20.5, 
      height: 2.7,
      air_change_an_hour: 1.5,
      
      elements: [
        {
          type:"Stone Wall 0.65m", 
          orientation:"Front", 
          width:5.46, height:2.36
        },
        {
          type:"Stone Wall 0.65m", 
          orientation:"Back", 
          width:5.46, height:2.36
        },
        {
          type:"Stone Wall 0.85m", 
          orientation:"Left", 
          area:9.0,
          boundary:"Old Bothy"
        },
        {
          type:"Timber Frame Wall", 
          orientation:"Right", 
          width:3.35, height:2.7
        },
        {
          type:"Ground Floor", 
          orientation:"", 
          area:20.5,
          boundary:'ground'
        },
        {
          type:"Insulated Roof", 
          orientation:"", 
          area:28.68
        },
        {
          type:"Secondary Glazing", 
          orientation:"SouthEast", 
          width:0.88, height:0.94,
          subtractfrom:0
        },
        {
          type:"Door", 
          orientation:"", 
          area:1.6,
          subtractfrom:3
        },
        {
          type:"Double Glazing", 
          orientation:"SouthEast", 
          area:1.02,
          subtractfrom:5
        },
        {
          type:"Double Glazing", 
          orientation:"NorthWest", 
          area:0.88,
          subtractfrom:5
        },
        {
          type:"Double Glazing", 
          orientation:"SouthEast", 
          area:0.37,
          subtractfrom:5
        },
        {
          type:"Double Glazing", 
          orientation:"NorthWest", 
          area:0.37,
          subtractfrom:5
        }
      ],
      
      radiators: [
          {name:"Double Panel Convector 1200x600",heat50k:2146},
          {name:"Double Panel Convector 1200x600",heat50k:2146},
          {name:"Double Panel Convector 1200x600",heat50k:2146}
      ]
    }
  }
};
