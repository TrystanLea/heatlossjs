# HeatLossJS

A small open source room by room heat loss calculator

![heatlossjs.png](heatlossjs.png)

Create html page, load heatloss.js tool with the following:

    <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/vue@2"></script>
    
    <script type="text/javascript" src="files/config_new.js"></script>
    <script type="text/javascript" src="files/bothylab_data.js"></script>
    <link rel="stylesheet" type="text/css" href="heatlossjs/style.css" />
    <div id="heatloss"></div>
    <script type="text/javascript" src="heatlossjs/model.js"></script>
    
Define your building in json object input definition (loaded in the first line above).

Examples: 

- [midterrace_data.js](files/midterrace_data.js)
- [bothylab_data.js](files/bothylab_data.js)
- [mainhouse_data.js](files/mainhouse_data.js)
- [study_data.js](files/study_data.js)

Examples with notes on input values:

- [Mid Terrace house](https://trystanlea.org.uk/roombyroomheatloss2)
- [Bothy](https://trystanlea.org.uk/bothy)
- [Detached house](https://trystanlea.org.uk/house)

### Heatlossjs adaptations and forks

- **heatlossjsITA** An Italian adaptation of heatlossjs developed by @jumpjack. New features include taking into account different rates of heat loss from external walls depending on orientation as well as translation to Italian. https://github.com/jumpjack/heatlossjsITA
