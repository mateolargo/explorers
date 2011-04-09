var GameView = Backbone.View.extend({

    initialize: function(options) {
        this.mapView = new MapView({model: this.model.gameMap, el: $('#Map')});
        this.mapView.render();
    },

    render: function() {

    }

});

var MapView = Backbone.View.extend({

    initialize: function(options) {
    },

    render: function() {
        //this.el.html('Hello, World');
    }
});
