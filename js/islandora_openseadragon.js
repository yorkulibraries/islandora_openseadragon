(function($) {
  Drupal.behaviors.islandoraOpenSeadragon = {
    attach: function(context, settings) {
      var resourceUri = settings.islandoraOpenSeadragon.resourceUri;
      var config = settings.islandoraOpenSeadragon.settings;
      $('#' + config['id']).each(function () {
        if (!$(this).hasClass('processed')) {
          config.tileSources = new Array();
          resourceUri = (resourceUri instanceof Array) ? resourceUri : new Array(resourceUri);
          $.each(resourceUri, function(index, uri) {
            var tileSource = new OpenSeadragon.DjatokaTileSource(config.djatokaServerBaseURL, uri, settings.islandoraOpenSeadragon);
            config.tileSources.push(tileSource);
          });
          var viewer = new OpenSeadragon(config);
          // Make the viewer available in the global scope.
          Drupal.settings.islandora_open_seadragon_viewer = viewer;
          var update_clip = function(viewer) {
            var fitWithinBoundingBox = function(d, max) {
              if (d.width/d.height > max.x/max.y) {
                return new OpenSeadragon.Point(max.x, parseInt(d.height * max.x/d.width));
              } else {
                return new OpenSeadragon.Point(parseInt(d.width * max.y/d.height),max.y);
              }
            }
            var getDisplayRegion = function(viewer, source) {
              // Determine portion of scaled image that is being displayed.
              var box = new OpenSeadragon.Rect(0, 0, source.x, source.y);
              var container = viewer.viewport.getContainerSize();
              var bounds = viewer.viewport.getBounds();
              // If image is offset to the left.
              if (bounds.x > 0){
                box.x = box.x - viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0,0)).x;
              }
              // If full image doesn't fit.
              if (box.x + source.x > container.x) {
                box.width = container.x - viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0,0)).x;
                if (box.width > container.x) {
                  box.width = container.x;
                }
              }
              // If image is offset up.
              if (bounds.y > 0) {
                box.y = box.y - viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0,0)).y;
              }
              // If full image doesn't fit.
              if (box.y + source.y > container.y) {
                box.height = container.y - viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0,0)).y;
                if (box.height > container.y) {
                  box.height = container.y;
                }
              }
              return box;
            }
            var source = viewer.source;
            var zoom = viewer.viewport.getZoom();
            var size = new OpenSeadragon.Rect(0, 0, source.dimensions.x, source.dimensions.y);
            var container = viewer.viewport.getContainerSize();
            var fit_source = fitWithinBoundingBox(size, container);
            var total_zoom = fit_source.x/source.dimensions.x;
            var container_zoom = fit_source.x/container.x;
            var level = (zoom * total_zoom) / container_zoom;
            var box = getDisplayRegion(viewer, new OpenSeadragon.Point(parseInt(source.dimensions.x*level), parseInt(source.dimensions.y*level)));
            var scaled_box = new OpenSeadragon.Rect(parseInt(box.x/level), parseInt(box.y/level), parseInt(box.width/level), parseInt(box.height/level));
            var params = {
              'url_ver': 'Z39.88-2004',
              'rft_id': source.imageID,
              'svc_id': 'info:lanl-repo/svc/getRegion',
              'svc_val_fmt': 'info:ofi/fmt:kev:mtx:jpeg2000',
              'svc.format': 'image/jpeg',
              'svc.region': scaled_box.y + ',' + scaled_box.x + ',' + (scaled_box.getBottomRight().y - scaled_box.y) + ',' + (scaled_box.getBottomRight().x - scaled_box.x),
            };
            var dimensions = (zoom <= 1) ? source.dimensions.x + ',' + source.dimensions.y : container.x + ',' + container.y;
            jQuery("#clip").attr('href',  Drupal.settings.basePath + 'islandora/object/' + settings.islandoraOpenSeadragon.pid + '/print?' + jQuery.param({
              'clip': source.baseURL + '?' + jQuery.param(params),
              'dimensions': dimensions,
            }));
          };
          viewer.addHandler("open", update_clip);
          viewer.addHandler("animationfinish", update_clip);
          if (settings.islandoraOpenSeadragon.fitToAspectRatio) {
            viewer.addHandler("open", function (viewer) {
              if (viewer.source.aspectRatio / viewer.viewport.getAspectRatio() <= 1) {
                viewer.viewport.fitVertically();
              }
              else {
                viewer.viewport.fitHorizontally();
              }
            });
          }
          $(this).addClass('processed');
        }
      });
    }
  };
})(jQuery);
