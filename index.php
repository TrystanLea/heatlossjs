<?php 
    $v = time(); 
    $example = file_get_contents("files/midterrace.json?v=2");

?>
<script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vue@2"></script>

<style>
  body { font-family:arial; text-align:center; }
  .page { max-width:960px; margin: 0 auto; }
  li {margin-bottom:10px}
</style>

<body>
  <div class="page">
  
    <h2>heatloss.js example</h2>
    <i>See linked resources at the bottom for more information on how to use this tool</i>
    <br><br>
    <script type="text/javascript" src="files/config_new.js?v=<?php echo $v; ?>"></script>
    <link rel="stylesheet" type="text/css" href="heatlossjs/style.css?v=<?php echo $v; ?>" />
    <div id="heatloss"></div>
    <br><br>
    <div style="text-align:left">
    <b>How to use this tool</b>
    <ul>
      <li>Example calculation and discussion: <a href="https://trystanlea.org.uk/roombyroomheatloss2">A mid terraced house</a></li>
      <li>This tool is based on the BS EN 12831:2003 heat loss calculation standard:<br><a href="https://trystanlea.org.uk/roombyroomheatloss">Room by room heat loss using MCS heat pump calculator</a></li>
      <li>There are a number of useful resources available on the MCS installer standards and tools page (see under Heat pump section), including U-value and heat emitter guides: <a href="https://mcscertified.com/standards-tools-library/">MCS installer standards and tools</a></li>
      <li><a href="https://mcscertified.com/wp-content/uploads/2020/04/Guidance-on-U-Values-from-Domestic-Heating-Design-Guide.pdf">MCS Guidance on U-Values from Domestic Heating Design Guide</a></li>
      <li>To generate a more accurate degree-days value for your location see: <a href="https://www.degreedays.net/">https://www.degreedays.net/</a></li>
      <li>This tool is open source and free to use, the source code is available on github: <a href="https://github.com/trystanlea/heatlossjs">https://github.com/trystanlea/heatlossjs</a></li>
      <li>You may also be interested in SAPjs, a tool for household energy assessment based on SAP 2012: <a href="https://openenergymonitor.org/sapjs">https://openenergymonitor.org/sapjs</a></li>
    </ul>
    </div>
  </div>
</body>

<script> 
var cachev = <?php echo $v; ?>; 
var config = <?php echo $example; ?>;
</script>

<script type="text/javascript" src="heatlossjs/ecodan.js?v=<?php echo $v; ?>"></script>
<script type="text/javascript" src="heatlossjs/model.js?v=<?php echo $v; ?>"></script>

