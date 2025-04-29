// Title and credits
var title = ui.Label('Water Quality and Vegetation Analysis Tool', {fontSize: '24px', fontWeight: 'bold', color: 'darkblue'});
var credits = ui.Label('Created by: Anshul, Aditya, Akanksha, Modini', {fontSize: '14px', color: 'gray'});
ui.root.insert(0, title);
ui.root.insert(1, credits);

var features = ee.FeatureCollection([]);
var map = ui.Map();
ui.root.add(map);

// Store charts and layers for later clearing
var charts = [];
var layers = [];

map.onClick(function(coords) {
  // Clear previous results
  charts.forEach(function(chart) { ui.root.widgets().remove(chart); });
  layers.forEach(function(layer) { map.layers().remove(layer); });
  charts = [];
  layers = [];
  
  // Create ROI and marker
  var roi = ee.Geometry.Point(coords.lon, coords.lat);
  var marker = ui.Map.Layer(
    ee.Geometry.Point(coords.lon, coords.lat), 
    {color: 'red'}, 
    'Selected Point'
  );
  map.layers().set(1, marker);
  layers.push(marker);

  // Define index calculations
  function calculateIndices(image) {
    // NDWI (Water Index)
    var ndwi = image.normalizedDifference(['B3', 'B5']).rename('NDWI');
    
    // NDVI (Vegetation Index)
    var ndvi = image.normalizedDifference(['B5', 'B4']).rename('NDVI');
    
    // pH (custom formula)
    var ph = image.expression(
      '(((B3 + B5) / 2)+1)*7', {
        'B3': image.select('B3'),
        'B5': image.select('B5')
      }
    ).rename('pH');
    
    return image.addBands([ndwi, ndvi, ph]);
  }

  // Get date range from user
  var startDate = prompt('Enter start date (YYYY-MM-DD):', '2015-01-01');
  var endDate = prompt('Enter end date (YYYY-MM-DD):', '2023-12-31');

  // Load Landsat 8 Collection 2 Tier 1 TOA data
  var collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA')
    .filterBounds(roi)
    .filterDate(startDate, endDate)
    .map(calculateIndices);

  // Reduce to median composite
  var image = collection.median();

  // Visualization parameters
  var ndwiVis = {min: -1, max: 1, palette: ['blue', 'white', 'green']};
  var ndviVis = {min: -1, max: 1, palette: ['brown', 'yellow', 'green']};
  var phVis = {min: 0, max: 14, palette: ['red', 'yellow', 'green', 'blue']};
  
  // Add layers to map with team credits in description
  var ndwiLayer = map.addLayer(
    image.select('NDWI').clip(roi), 
    ndwiVis, 
    'NDWI (Water Index) - Team: Anshul, Aditya, Akanksha, Modini'
  );
  
  var ndviLayer = map.addLayer(
    image.select('NDVI').clip(roi), 
    ndviVis, 
    'NDVI (Vegetation Index) - Team: Anshul, Aditya, Akanksha, Modini'
  );
  
  var phLayer = map.addLayer(
    image.select('pH').clip(roi), 
    phVis, 
    'pH Estimation - Team: Anshul, Aditya, Akanksha, Modini'
  );
  
  layers.push(ndwiLayer, ndviLayer, phLayer);

  // Create charts with team name in title
  var ndwiChart = ui.Chart.image.series({
    imageCollection: collection.select('NDWI'),
    region: roi,
    reducer: ee.Reducer.mean(),
    scale: 30
  }).setOptions({
    title: 'NDWI Time Series - Team: Anshul, Aditya, Akanksha, Modini',
    vAxis: {title: 'NDWI Value'},
    hAxis: {title: 'Date', format: 'YYYY-MM-dd'},
    colors: ['blue']
  });

  var ndviChart = ui.Chart.image.series({
    imageCollection: collection.select('NDVI'),
    region: roi,
    reducer: ee.Reducer.mean(),
    scale: 30
  }).setOptions({
    title: 'NDVI Time Series - Team: Anshul, Aditya, Akanksha, Modini',
    vAxis: {title: 'NDVI Value'},
    hAxis: {title: 'Date', format: 'YYYY-MM-dd'},
    colors: ['green']
  });

  var phChart = ui.Chart.image.series({
    imageCollection: collection.select('pH'),
    region: roi,
    reducer: ee.Reducer.mean(),
    scale: 30
  }).setOptions({
    title: 'pH Time Series - Team: Anshul, Aditya, Akanksha, Modini',
    vAxis: {title: 'pH Value'},
    hAxis: {title: 'Date', format: 'YYYY-MM-dd'},
    colors: ['red']
  });

  // Add charts to UI
  ui.root.add(ndwiChart);
  ui.root.add(ndviChart);
  ui.root.add(phChart);
  charts.push(ndwiChart, ndviChart, phChart);

  // Print statistics with team credits
  var stats = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: roi,
    scale: 30
  });
  print('Average values at selected point - Analysis by: Anshul, Aditya, Akanksha, Modini', stats);
});

// Add instructions
var instructions = ui.Label('Click on the map to analyze water quality and vegetation indices', {
  fontSize: '16px',
  margin: '10px'
});
ui.root.add(instructions);
