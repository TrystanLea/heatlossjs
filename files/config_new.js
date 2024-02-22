var config_new = {
  heatlossjs_version: 3,
  project_name: "new",
  
  degreedays: 2228,
  heating_MWT: 40.0,
  heatpump_flow_rate: 10,
  
  T: {
    external: -3.0,
    ground: 10.0,
    unheated: 10.0
  },

  element_type: {
    "Wall:External": { uvalue:0.3 },
    "Wall:Internal": { uvalue:1.7 },
    "Window": { uvalue:1.6 },
    "Door": { uvalue:1.6 },
    "Floor": { uvalue:0.6 },
    "Roof": { uvalue:0.15 }
  },
  
  rooms: {
   "Livingroom":{
      temperature: 20.0,
      area: 0.0, 
      width: 4.0,
      length: 4.0,
      height: 2.4,
      air_change_an_hour: 0.5,
      
      elements: [
      ],
      
      radiators: [
      ],
      
      ufh: [
      ]
    }
  },
  
  elements: []
};
