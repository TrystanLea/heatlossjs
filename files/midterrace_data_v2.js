var config = {
  "project_name": "midterrace",
  "degreedays": 1800,
  "heating_MWT": 40,
  "heatpump_flow_rate": 12,
  "T": {
    "external": -3,
    "ground": 10,
    "unheated": 18
  },
  "element_type": {
    "Floor:Ground": {
      "uvalue": 1
    },
    "Floor:InsulatedGround": {
      "uvalue": 0.32
    },
    "Floor:First": {
      "uvalue": 1.7
    },
    "Floor:Loft": {
      "uvalue": 0.18
    },
    "Wall:External": {
      "uvalue": 1.4
    },
    "Wall:Internal": {
      "uvalue": 2
    },
    "Wall:Party": {
      "uvalue": 0.5
    },
    "Glazing:Double": {
      "uvalue": 1.6
    },
    "Wall:InternalOpenDoor": {
      "uvalue": 35
    }
  },
  "rooms": {
    "livingroom": {
      "temperature": 20,
      "width": 3.4,
      "length": 7.2,
      "height": 2.4,
      "air_change_an_hour": 1.5,
      "elements": [
        {
          "type": "Wall:External",
          "orientation": "South",
          "width": 3.4,
          "height": 2.4,
          "boundary": "external",
          "temperature": -3,
          "A": 5.279999999999999,
          "uvalue": 1.4,
          "wk": 7.391999999999999,
          "deltaT": 23,
          "heat": 170.01599999999996,
          "kwh": 319.3343999999999
        },
        {
          "type": "Wall:Party",
          "orientation": "West",
          "width": 7.2,
          "height": 2.4,
          "boundary": "unheated",
          "temperature": 18,
          "A": 17.28,
          "uvalue": 0.5,
          "wk": 8.64,
          "deltaT": 2,
          "heat": 17.28,
          "kwh": 0
        },
        {
          "type": "Wall:External",
          "orientation": "North",
          "width": 1.7,
          "height": 2.4,
          "boundary": "external",
          "temperature": -3,
          "A": 2.58,
          "uvalue": 1.4,
          "wk": 3.6119999999999997,
          "deltaT": 23,
          "heat": 83.076,
          "kwh": 156.0384
        },
        {
          "type": "Wall:Internal",
          "orientation": "East",
          "width": 7.2,
          "height": 2.4,
          "boundary": "hall",
          "temperature": 20,
          "A": 17.28,
          "uvalue": 2,
          "wk": 34.56,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Floor:InsulatedGround",
          "width": 7.2,
          "height": 3.4,
          "boundary": "ground",
          "orientation": "",
          "temperature": 10,
          "A": 24.48,
          "uvalue": 0.32,
          "wk": 7.833600000000001,
          "deltaT": 10,
          "heat": 78.33600000000001,
          "kwh": 338.41152000000005
        },
        {
          "type": "Floor:First",
          "width": 2.7,
          "height": 3.2,
          "boundary": "bed2",
          "orientation": "",
          "temperature": 20,
          "A": 8.64,
          "uvalue": 1.7,
          "wk": 14.688,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Glazing:Double",
          "subtractfrom": 0,
          "width": 1.8,
          "height": 1.6,
          "A": 2.8800000000000003,
          "orientation": "",
          "boundary": "external",
          "temperature": -3,
          "uvalue": 1.6,
          "wk": 4.6080000000000005,
          "deltaT": 23,
          "heat": 105.98400000000001,
          "kwh": 199.06560000000005
        },
        {
          "type": "Glazing:Double",
          "subtractfrom": 2,
          "width": 1,
          "height": 1.5,
          "A": 1.5,
          "orientation": "",
          "boundary": "external",
          "temperature": -3,
          "uvalue": 1.6,
          "wk": 2.4000000000000004,
          "deltaT": 23,
          "heat": 55.20000000000001,
          "kwh": 103.68000000000002
        },
        {
          "type": "Wall:InternalOpenDoor",
          "subtractfrom": "",
          "width": 2.4,
          "height": 2.4,
          "A": 5.76,
          "orientation": "",
          "boundary": "kitchen",
          "temperature": 20,
          "uvalue": 35,
          "wk": 201.6,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Floor:First",
          "subtractfrom": "",
          "width": 2.8,
          "height": 3.5,
          "A": 9.799999999999999,
          "orientation": "",
          "boundary": "bed1",
          "temperature": 20,
          "uvalue": 1.7,
          "wk": 16.659999999999997,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Floor:First",
          "subtractfrom": "",
          "width": 0.8,
          "height": 4.4,
          "A": 3.5200000000000005,
          "orientation": "",
          "boundary": "landing",
          "temperature": 20,
          "uvalue": 1.7,
          "wk": 5.984000000000001,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Floor:First",
          "subtractfrom": "",
          "width": 0.8,
          "height": 2.2,
          "A": 1.7600000000000002,
          "orientation": "",
          "boundary": "study",
          "temperature": 20,
          "uvalue": 1.7,
          "wk": 2.9920000000000004,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        }
      ],
      "radiators": [
        {
          "name": "Double Panel Convector 1200x600",
          "heat50k": 2146,
          "model": "pow",
          "heat": 635.1870054073054
        },
        {
          "name": "Double Panel Convector 1200x600",
          "heat50k": 2146,
          "model": "pow",
          "heat": 635.1870054073054
        },
        {
          "name": "Double Panel Convector 1200x600",
          "heat50k": 2146,
          "model": "pow",
          "heat": 635.1870054073054
        }
      ],
      "wk": 340.05184,
      "heat": 1178.78352,
      "kwh": 2372.8826879999997,
      "A": 100.76,
      "area": 24.48,
      "volume": 58.751999999999995,
      "infiltration_heat": 668.89152,
      "total_radiator_output": 1905.5610162219161,
      "total_ufh_output": 0,
      "ufh": [],
      "total_heat_output": 1905.5610162219161,
      "energy": 1161.991275461192
    },
    "hall": {
      "temperature": 20,
      "width": 1,
      "length": 7.2,
      "height": 2.4,
      "air_change_an_hour": 1.5,
      "elements": [
        {
          "type": "Wall:External",
          "orientation": "South",
          "width": 1,
          "height": 2.4,
          "boundary": "external",
          "temperature": -3,
          "A": 0.8799999999999999,
          "uvalue": 1.4,
          "wk": 1.2319999999999998,
          "deltaT": 23,
          "heat": 28.335999999999995,
          "kwh": 53.222399999999986
        },
        {
          "type": "Wall:Internal",
          "orientation": "West",
          "width": 7.2,
          "height": 2.4,
          "boundary": "livingroom",
          "temperature": 20,
          "A": 17.28,
          "uvalue": 2,
          "wk": 34.56,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Wall:Party",
          "orientation": "East",
          "width": 7.2,
          "height": 2.4,
          "boundary": "unheated",
          "temperature": 18,
          "A": 17.28,
          "uvalue": 0.5,
          "wk": 8.64,
          "deltaT": 2,
          "heat": 17.28,
          "kwh": 0
        },
        {
          "type": "Floor:Ground",
          "width": 7.2,
          "height": 1,
          "boundary": "ground",
          "orientation": "",
          "temperature": 10,
          "A": 7.2,
          "uvalue": 1,
          "wk": 7.2,
          "deltaT": 10,
          "heat": 72,
          "kwh": 311.04
        },
        {
          "type": "Floor:First",
          "width": 1,
          "height": 2.2,
          "boundary": "study",
          "orientation": "",
          "temperature": 20,
          "A": 2.2,
          "uvalue": 1.7,
          "wk": 3.74,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Glazing:Double",
          "subtractfrom": 0,
          "width": 0.8,
          "height": 1.9,
          "A": 1.52,
          "orientation": "",
          "boundary": "external",
          "temperature": -3,
          "uvalue": 1.6,
          "wk": 2.4320000000000004,
          "deltaT": 23,
          "heat": 55.93600000000001,
          "kwh": 105.06240000000001
        },
        {
          "type": "Wall:InternalOpenDoor",
          "subtractfrom": "",
          "width": 1,
          "height": 4.4,
          "A": 4.4,
          "orientation": "",
          "boundary": "landing",
          "temperature": 20,
          "uvalue": 35,
          "wk": 154,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        }
      ],
      "radiators": [
        {
          "name": "Double Panel Convector 1200x600",
          "heat50k": 2146,
          "model": "pow",
          "heat": 635.1870054073054
        }
      ],
      "wk": 220.3576,
      "heat": 370.2848,
      "kwh": 838.84032,
      "A": 50.760000000000005,
      "area": 7.2,
      "volume": 17.28,
      "infiltration_heat": 196.73280000000003,
      "total_radiator_output": 635.1870054073054,
      "total_ufh_output": 0,
      "ufh": [],
      "total_heat_output": 635.1870054073054,
      "energy": 1052.2819735502046
    },
    "kitchen": {
      "temperature": 20,
      "width": 2.4,
      "length": 3,
      "height": 2.4,
      "air_change_an_hour": 2,
      "elements": [
        {
          "type": "Wall:InternalOpenDoor",
          "orientation": "South",
          "width": 2.4,
          "height": 2.4,
          "boundary": "livingroom",
          "temperature": 20,
          "A": 5.76,
          "uvalue": 35,
          "wk": 201.6,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Wall:External",
          "orientation": "West",
          "width": 3,
          "height": 2.4,
          "boundary": "external",
          "temperature": -3,
          "A": 4.51,
          "uvalue": 1.4,
          "wk": 6.313999999999999,
          "deltaT": 23,
          "heat": 145.22199999999998,
          "kwh": 272.7648
        },
        {
          "type": "Wall:External",
          "orientation": "North",
          "width": 2.4,
          "height": 2.4,
          "boundary": "external",
          "temperature": -3,
          "A": 5.76,
          "uvalue": 1.4,
          "wk": 8.064,
          "deltaT": 23,
          "heat": 185.472,
          "kwh": 348.3648
        },
        {
          "type": "Wall:Party",
          "orientation": "East",
          "width": 3,
          "height": 2.4,
          "boundary": "unheated",
          "temperature": 18,
          "A": 7.199999999999999,
          "uvalue": 0.5,
          "wk": 3.5999999999999996,
          "deltaT": 2,
          "heat": 7.199999999999999,
          "kwh": 0
        },
        {
          "type": "Floor:Ground",
          "width": 3,
          "height": 2.4,
          "boundary": "ground",
          "orientation": "",
          "temperature": 10,
          "A": 7.199999999999999,
          "uvalue": 1,
          "wk": 7.199999999999999,
          "deltaT": 10,
          "heat": 72,
          "kwh": 311.03999999999996
        },
        {
          "type": "Floor:First",
          "width": 2.4,
          "height": 3.3,
          "boundary": "bathroom",
          "orientation": "",
          "temperature": 20,
          "A": 7.919999999999999,
          "uvalue": 1.7,
          "wk": 13.463999999999999,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Glazing:Double",
          "subtractfrom": 1,
          "width": 0.9,
          "height": 1.3,
          "A": 1.1700000000000002,
          "orientation": "",
          "boundary": "external",
          "temperature": -3,
          "uvalue": 1.6,
          "wk": 1.8720000000000003,
          "deltaT": 23,
          "heat": 43.056000000000004,
          "kwh": 80.87040000000002
        },
        {
          "type": "Glazing:Double",
          "subtractfrom": 1,
          "width": 0.8,
          "height": 1.9,
          "A": 1.52,
          "orientation": "",
          "boundary": "external",
          "temperature": -3,
          "uvalue": 1.6,
          "wk": 2.4320000000000004,
          "deltaT": 23,
          "heat": 55.93600000000001,
          "kwh": 105.06240000000001
        }
      ],
      "radiators": [],
      "wk": 255.95079999999996,
      "heat": 771.1964,
      "kwh": 1610.7897600000001,
      "A": 41.040000000000006,
      "area": 7.199999999999999,
      "volume": 17.279999999999998,
      "infiltration_heat": 262.3104,
      "total_radiator_output": 0,
      "total_ufh_output": 0,
      "ufh": [],
      "total_heat_output": 0,
      "energy": 698.1773176109298
    },
    "bed1": {
      "temperature": 20,
      "width": 3,
      "length": 3.5,
      "height": 2.4,
      "air_change_an_hour": 1.5,
      "elements": [
        {
          "type": "Wall:Internal",
          "orientation": "South",
          "width": 2.8,
          "height": 2.4,
          "boundary": "bed2",
          "temperature": 20,
          "A": 6.72,
          "uvalue": 2,
          "wk": 13.44,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Wall:Party",
          "orientation": "West",
          "width": 3.5,
          "height": 2.4,
          "boundary": "unheated",
          "temperature": 18,
          "A": 8.4,
          "uvalue": 0.5,
          "wk": 4.2,
          "deltaT": 2,
          "heat": 8.4,
          "kwh": 0
        },
        {
          "type": "Wall:External",
          "orientation": "North",
          "width": 1.7,
          "height": 2.4,
          "boundary": "external",
          "temperature": -3,
          "A": 2.91,
          "uvalue": 1.4,
          "wk": 4.074,
          "deltaT": 23,
          "heat": 93.702,
          "kwh": 175.9968
        },
        {
          "type": "Wall:Internal",
          "orientation": "North",
          "width": 1,
          "height": 2.4,
          "boundary": "bathroom",
          "temperature": 20,
          "A": 2.4,
          "uvalue": 2,
          "wk": 4.8,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Wall:Internal",
          "orientation": "East",
          "width": 3.5,
          "height": 2.4,
          "boundary": "landing",
          "temperature": 20,
          "A": 8.4,
          "uvalue": 2,
          "wk": 16.8,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Floor:First",
          "width": 2.8,
          "height": 3.5,
          "boundary": "livingroom",
          "orientation": "",
          "temperature": 20,
          "A": 9.799999999999999,
          "uvalue": 1.7,
          "wk": 16.659999999999997,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Floor:Loft",
          "width": 2.8,
          "height": 3.5,
          "orientation": "",
          "boundary": "external",
          "temperature": -3,
          "A": 9.799999999999999,
          "uvalue": 0.18,
          "wk": 1.7639999999999998,
          "deltaT": 23,
          "heat": 40.571999999999996,
          "kwh": 76.20479999999999
        },
        {
          "type": "Glazing:Double",
          "subtractfrom": 2,
          "width": 0.9,
          "height": 1.3,
          "A": 1.1700000000000002,
          "orientation": "",
          "boundary": "external",
          "temperature": -3,
          "uvalue": 1.6,
          "wk": 1.8720000000000003,
          "deltaT": 23,
          "heat": 43.056000000000004,
          "kwh": 80.87040000000002
        }
      ],
      "radiators": [
        {
          "name": "Double Panel Convector 1200x500",
          "heat50k": 1834,
          "model": "pow",
          "heat": 542.8392208373709
        }
      ],
      "wk": 76.084,
      "heat": 472.632,
      "kwh": 871.9488,
      "A": 49.599999999999994,
      "area": 10.5,
      "volume": 25.2,
      "infiltration_heat": 286.902,
      "total_radiator_output": 542.8392208373709,
      "total_ufh_output": 0,
      "ufh": [],
      "total_heat_output": 542.8392208373709,
      "energy": 1045.3800315700053
    },
    "bed2": {
      "temperature": 20,
      "width": 2.6,
      "length": 3.2,
      "height": 2.4,
      "air_change_an_hour": 1.5,
      "elements": [
        {
          "type": "Wall:External",
          "orientation": "South",
          "width": 2.6,
          "height": 2.4,
          "boundary": "external",
          "temperature": -3,
          "A": 6.24,
          "uvalue": 1.4,
          "wk": 8.735999999999999,
          "deltaT": 23,
          "heat": 200.92799999999997,
          "kwh": 377.39519999999993
        },
        {
          "type": "Wall:Party",
          "orientation": "West",
          "width": 3.2,
          "height": 2.4,
          "boundary": "unheated",
          "temperature": 18,
          "A": 7.68,
          "uvalue": 0.5,
          "wk": 3.84,
          "deltaT": 2,
          "heat": 7.68,
          "kwh": 0
        },
        {
          "type": "Wall:Internal",
          "orientation": "North",
          "width": 2.8,
          "height": 2.4,
          "boundary": "bed1",
          "temperature": 20,
          "A": 6.72,
          "uvalue": 2,
          "wk": 13.44,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Wall:Internal",
          "orientation": "East",
          "width": 1,
          "height": 2.4,
          "boundary": "landing",
          "temperature": 20,
          "A": 2.4,
          "uvalue": 2,
          "wk": 4.8,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Floor:First",
          "width": 2.7,
          "height": 3.2,
          "boundary": "livingroom",
          "orientation": "",
          "temperature": 20,
          "A": 8.64,
          "uvalue": 1.7,
          "wk": 14.688,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Floor:Loft",
          "width": 2.7,
          "height": 3.2,
          "orientation": "",
          "boundary": "external",
          "temperature": -3,
          "A": 8.64,
          "uvalue": 0.18,
          "wk": 1.5552000000000001,
          "deltaT": 23,
          "heat": 35.769600000000004,
          "kwh": 67.18464
        },
        {
          "type": "Glazing:Double",
          "subtractfrom": "32",
          "width": 0.9,
          "height": 1.3,
          "orientation": "",
          "boundary": "external",
          "temperature": -3,
          "A": 1.1700000000000002,
          "uvalue": 1.6,
          "wk": 1.8720000000000003,
          "deltaT": 23,
          "heat": 43.056000000000004,
          "kwh": 80.87040000000002
        },
        {
          "type": "Wall:Internal",
          "subtractfrom": "32",
          "width": 2.2,
          "height": 2.4,
          "orientation": "East",
          "boundary": "study",
          "temperature": 20,
          "A": 5.28,
          "uvalue": 2,
          "wk": 10.56,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        }
      ],
      "radiators": [
        {
          "name": "Double Panel Convector 1200x500",
          "heat50k": 1834,
          "model": "pow",
          "heat": 542.8392208373709
        }
      ],
      "wk": 69.37536,
      "heat": 514.76928,
      "kwh": 952.4459519999998,
      "A": 46.77,
      "area": 8.32,
      "volume": 19.968,
      "infiltration_heat": 227.33568,
      "total_radiator_output": 542.8392208373709,
      "total_ufh_output": 0,
      "ufh": [],
      "total_heat_output": 542.8392208373709,
      "energy": 1032.7373997197212
    },
    "study": {
      "temperature": 20,
      "width": 1.8,
      "length": 2.2,
      "height": 2.4,
      "air_change_an_hour": 1.5,
      "elements": [
        {
          "type": "Wall:External",
          "orientation": "South",
          "width": 1.8,
          "height": 2.4,
          "boundary": "external",
          "temperature": -3,
          "A": 3.2,
          "uvalue": 1.4,
          "wk": 4.4799999999999995,
          "deltaT": 23,
          "heat": 103.03999999999999,
          "kwh": 193.53599999999997
        },
        {
          "type": "Wall:Internal",
          "orientation": "West",
          "width": 2.2,
          "height": 2.4,
          "boundary": "bed2",
          "temperature": 20,
          "A": 5.28,
          "uvalue": 2,
          "wk": 10.56,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Wall:Internal",
          "orientation": "North",
          "width": 1.8,
          "height": 2.4,
          "boundary": "landing",
          "temperature": 20,
          "A": 4.32,
          "uvalue": 2,
          "wk": 8.64,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Wall:Party",
          "orientation": "East",
          "width": 2.2,
          "height": 2.4,
          "boundary": "unheated",
          "temperature": 18,
          "A": 5.28,
          "uvalue": 0.5,
          "wk": 2.64,
          "deltaT": 2,
          "heat": 5.28,
          "kwh": 0
        },
        {
          "type": "Floor:First",
          "width": 0.8,
          "height": 2.2,
          "boundary": "livingroom",
          "orientation": "",
          "temperature": 20,
          "A": 1.7600000000000002,
          "uvalue": 1.7,
          "wk": 2.9920000000000004,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Floor:Loft",
          "width": 1.8,
          "height": 2.2,
          "orientation": "",
          "boundary": "external",
          "temperature": -3,
          "A": 3.9600000000000004,
          "uvalue": 0.18,
          "wk": 0.7128000000000001,
          "deltaT": 23,
          "heat": 16.3944,
          "kwh": 30.792960000000004
        },
        {
          "type": "Glazing:Double",
          "subtractfrom": 0,
          "width": 0.8,
          "height": 1.4,
          "A": 1.1199999999999999,
          "orientation": "",
          "boundary": "external",
          "temperature": -3,
          "uvalue": 1.6,
          "wk": 1.7919999999999998,
          "deltaT": 23,
          "heat": 41.215999999999994,
          "kwh": 77.41439999999999
        },
        {
          "type": "Floor:First",
          "subtractfrom": "",
          "width": 1,
          "height": 2.2,
          "A": 2.2,
          "orientation": "",
          "boundary": "hall",
          "temperature": 20,
          "uvalue": 1.7,
          "wk": 3.74,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        }
      ],
      "radiators": [
        {
          "name": "Double Panel Convector 1000x400",
          "heat50k": 1273,
          "model": "pow",
          "heat": 376.7908005048927
        }
      ],
      "wk": 40.26128,
      "heat": 274.13344,
      "kwh": 504.97689599999995,
      "A": 27.120000000000005,
      "area": 3.9600000000000004,
      "volume": 9.504000000000001,
      "infiltration_heat": 108.20304,
      "total_radiator_output": 376.7908005048927,
      "total_ufh_output": 0,
      "ufh": [],
      "total_heat_output": 376.7908005048927,
      "energy": 1101.2545688836196
    },
    "landing": {
      "temperature": 20,
      "width": 1.5,
      "length": 4.4,
      "height": 2.4,
      "air_change_an_hour": 1,
      "elements": [
        {
          "type": "Wall:Internal",
          "orientation": "South",
          "width": 1.8,
          "height": 2.4,
          "boundary": "study",
          "temperature": 20,
          "A": 4.32,
          "uvalue": 2,
          "wk": 8.64,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Wall:Internal",
          "orientation": "West",
          "width": 3.5,
          "height": 2.4,
          "boundary": "bed1",
          "temperature": 20,
          "A": 8.4,
          "uvalue": 2,
          "wk": 16.8,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Wall:InternalOpenDoor",
          "orientation": "North",
          "width": 1.8,
          "height": 2.4,
          "boundary": "bathroom",
          "temperature": 20,
          "A": 4.32,
          "uvalue": 35,
          "wk": 151.20000000000002,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Wall:Party",
          "orientation": "East",
          "width": 4.4,
          "height": 2.4,
          "boundary": "unheated",
          "temperature": 18,
          "A": 10.56,
          "uvalue": 0.5,
          "wk": 5.28,
          "deltaT": 2,
          "heat": 10.56,
          "kwh": 0
        },
        {
          "type": "Wall:InternalOpenDoor",
          "width": 1,
          "height": 4.4,
          "boundary": "hall",
          "orientation": "",
          "temperature": 20,
          "A": 4.4,
          "uvalue": 35,
          "wk": 154,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Floor:Loft",
          "width": 1.5,
          "height": 4.4,
          "orientation": "",
          "boundary": "external",
          "temperature": -3,
          "A": 6.6000000000000005,
          "uvalue": 0.18,
          "wk": 1.188,
          "deltaT": 23,
          "heat": 27.323999999999998,
          "kwh": 51.321600000000004
        },
        {
          "type": "Wall:Internal",
          "width": 1,
          "height": 2.4,
          "orientation": "",
          "boundary": "bed2",
          "temperature": 20,
          "A": 2.4,
          "uvalue": 2,
          "wk": 4.8,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Floor:First",
          "width": 0.8,
          "height": 4.4,
          "orientation": "",
          "boundary": "livingroom",
          "temperature": 20,
          "A": 3.5200000000000005,
          "uvalue": 1.7,
          "wk": 5.984000000000001,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        }
      ],
      "wk": 353.1192,
      "heat": 158.1096,
      "kwh": 277.13664,
      "A": 44.52,
      "area": 6.6000000000000005,
      "volume": 15.84,
      "infiltration_heat": 120.2256,
      "total_radiator_output": 0,
      "radiators": [],
      "total_ufh_output": 0,
      "ufh": [],
      "total_heat_output": 0,
      "energy": 918.4280873078443
    },
    "bathroom": {
      "temperature": 20,
      "width": 2.4,
      "length": 3.3,
      "height": 2.4,
      "air_change_an_hour": 2,
      "elements": [
        {
          "type": "Wall:InternalOpenDoor",
          "orientation": "South",
          "width": 1.8,
          "height": 2.4,
          "boundary": "landing",
          "temperature": 20,
          "A": 4.32,
          "uvalue": 35,
          "wk": 151.20000000000002,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Wall:External",
          "orientation": "West",
          "width": 3.3,
          "height": 2.4,
          "boundary": "external",
          "temperature": -3,
          "A": 7.919999999999999,
          "uvalue": 1.4,
          "wk": 11.087999999999997,
          "deltaT": 23,
          "heat": 255.02399999999994,
          "kwh": 479.0015999999999
        },
        {
          "type": "Wall:External",
          "orientation": "North",
          "width": 2.4,
          "height": 2.4,
          "boundary": "external",
          "temperature": -3,
          "A": 5.04,
          "uvalue": 1.4,
          "wk": 7.055999999999999,
          "deltaT": 23,
          "heat": 162.28799999999998,
          "kwh": 304.81919999999997
        },
        {
          "type": "Wall:Party",
          "orientation": "East",
          "width": 3.3,
          "height": 2.4,
          "boundary": "unheated",
          "temperature": 18,
          "A": 7.919999999999999,
          "uvalue": 0.5,
          "wk": 3.9599999999999995,
          "deltaT": 2,
          "heat": 7.919999999999999,
          "kwh": 0
        },
        {
          "type": "Floor:First",
          "width": 2.4,
          "height": 3.3,
          "boundary": "kitchen",
          "orientation": "",
          "temperature": 20,
          "A": 7.919999999999999,
          "uvalue": 1.7,
          "wk": 13.463999999999999,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        },
        {
          "type": "Floor:Loft",
          "width": 2.4,
          "height": 3.3,
          "orientation": "",
          "boundary": "external",
          "temperature": -3,
          "A": 7.919999999999999,
          "uvalue": 0.18,
          "wk": 1.4255999999999998,
          "deltaT": 23,
          "heat": 32.788799999999995,
          "kwh": 61.58591999999999
        },
        {
          "type": "Glazing:Double",
          "subtractfrom": 2,
          "width": 0.8,
          "height": 0.9,
          "A": 0.7200000000000001,
          "orientation": "",
          "boundary": "external",
          "temperature": -3,
          "uvalue": 1.6,
          "wk": 1.1520000000000001,
          "deltaT": 23,
          "heat": 26.496000000000002,
          "kwh": 49.76640000000001
        },
        {
          "type": "Wall:Internal",
          "subtractfrom": "",
          "width": 1,
          "height": 2.4,
          "A": 2.4,
          "orientation": "",
          "boundary": "bed1",
          "temperature": 20,
          "uvalue": 2,
          "wk": 4.8,
          "deltaT": 0,
          "heat": 0,
          "kwh": 0
        }
      ],
      "radiators": [
        {
          "name": "Double Panel Convector 800x600",
          "heat50k": 1430,
          "model": "pow",
          "heat": 423.26067927886606
        }
      ],
      "wk": 206.69088000000002,
      "heat": 773.0582399999998,
      "kwh": 1437.1292159999998,
      "A": 44.16,
      "area": 7.919999999999999,
      "volume": 19.007999999999996,
      "infiltration_heat": 288.54143999999997,
      "total_radiator_output": 423.26067927886606,
      "total_ufh_output": 0,
      "ufh": [],
      "total_heat_output": 423.26067927886606,
      "energy": 794.3416226473572
    }
  },
  "house": {
    "heatloss": 4512.967280000001,
    "kwh": 8866.150272,
    "total_heat_output": 4426.4779430877215,
    "internal_heat_balance": 0,
    "wk": null
  },
  "JK": 50,
  "heatpump_flow_temperature": 42.26655297776369,
  "cop_calculation_method": "ecodan",
  "heatpump_capacity": 5,
  "heatpump_COP": 2.7539332525441176,
  "heatpump_elec": 1607.3294220179398,
  "solver_running": false
}
