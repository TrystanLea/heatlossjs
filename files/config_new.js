var config_new = {
  degreedays: 2228,
  heating_MWT: 40.0,
  
  T: {
    external: -3.0,
    ground: 10.0,
    unheated: 10.0
  },

  element_type: {
    "Floor": { uvalue:0.6 },
    "Roof": { uvalue:0.15 },
    "Wall": { uvalue:0.3 },
    "Window": { uvalue:1.6 },
    "Door": { uvalue:1.6 }
  },
  
  rooms: {
   "Livingroom":{
      temperature: 20.0,
      area: 0.0, 
      height: 0.0,
      air_change_an_hour: 1.0,
      
      elements: [
      ],
      
      radiators: [
      ],
      
      ufh: [
      ]
    }
  }
};
