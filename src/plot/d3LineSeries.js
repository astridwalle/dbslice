import { dbsliceData } from '../core/dbsliceData.js';
import { render } from '../core/render.js';
import * as d3 from 'd3';
//import * as tip from 'd3-tip';

const d3LineSeries = {

    make : function ( element, data, layout ) {

        var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr( "class", "plotArea" );

        d3LineSeries.update( element, data, layout );

    },

    update : function ( element, data, layout ) {

        var container = d3.select(element);
        var svg = container.select("svg");
        var plotArea = svg.select(".plotArea");

        var colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );
        if ( layout.cSet !== undefined) colour.domain( layout.cSet )

        var lines = plotArea.selectAll(".line");

        if ( layout.highlightTasks == true ) {
            if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {
                lines
                    //.style( "opacity" , 1.0 )
                    .style( "stroke-width", "2.5px" )
                    .style( "stroke", function( d ) { return colour( d.cKey ); } );   
            } else {
                lines
                    //.style( "opacity" , 0.2)
                    .style( "stroke-width", "2.5px" )
                    .style( "stroke", "#d3d3d3" ); 
                dbsliceData.highlightTasks.forEach( function (taskId) {
                    lines.filter( (d,i) => d.taskId == taskId)
                        //.style( "opacity" , 1.0)
                        .style( "stroke", function( d ) { return colour( d.cKey ); } ) 
                        .style( "stroke-width", "4px" )
                        .each(function() {
                            this.parentNode.parentNode.appendChild(this.parentNode);
                        });
                });
            }
        }

        if (data.newData == false) {
            return
        }

        var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        let plotRowIndex = container.attr("plot-row-index");
        let plotIndex = container.attr("plot-index");
        let clipId = "clip-"+plotRowIndex+"-"+plotIndex; 

        var svgWidth = svg.attr("width");
        var svgHeight = svg.attr("height");

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var nseries = data.series.length;

        var xmin = d3.min( data.series[0].data, function(d) { return d.x; } );
        var xmax = d3.max( data.series[0].data, function(d) { return d.x; } );
        var ymin = d3.min( data.series[0].data, function(d) { return d.y; } );
        var ymax = d3.max( data.series[0].data, function(d) { return d.y; } );

        for (var n = 1; n < nseries; ++n) {
            var xminNow =  d3.min( data.series[n].data, function(d) { return d.x; } );
            ( xminNow < xmin ) ? xmin = xminNow : xmin = xmin;
            var xmaxNow =  d3.max( data.series[n].data, function(d) { return d.x; } );
            ( xmaxNow > xmax ) ? xmax = xmaxNow : xmax = xmax;
            var yminNow =  d3.min( data.series[n].data, function(d) { return d.y; } );
            ( yminNow < ymin ) ? ymin = yminNow : ymin = ymin;
            var ymaxNow =  d3.max( data.series[n].data, function(d) { return d.y; } );
            ( ymaxNow > ymax ) ? ymax = ymaxNow : ymax = ymax;
        }

        if ( layout.xRange === undefined ) {
            var xRange = [xmin, xmax];
        } else {
            var xRange = layout.xRange;
        }

        if ( layout.yRange === undefined ) {
            var yRange = [ymin, ymax];
        } else {
            var yRange = layout.yRange;
        }

        if ( layout.xscale == "time" ) {
            var xscale = d3.scaleTime(); 
            var xscale0 = d3.scaleTime();        
        } else {
            var xscale = d3.scaleLinear();
            var xscale0 = d3.scaleLinear();
        }

        xscale.range( [0, width] )
              .domain( xRange );

        xscale0.range( [0, width] )
              .domain( xRange );

        var yscale = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        var yscale0 = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        //var colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );
        //if ( layout.cSet !== undefined) colour.domain( layout.cSet );

        var line = d3.line()
            .x( function( d ) { return xscale( d.x ); } )
            .y( function( d ) { return yscale( d.y ); } );

        var clip = svg.append("defs").append("clipPath")
            .attr("id", clipId)
            .append("rect")
                .attr("width", width)
                .attr("height", height);

        var zoom = d3.zoom()
           .scaleExtent([0.5, Infinity])
            .on("zoom", zoomed);

        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);

        var tip = tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function( d ) {
                return "<span>"+d.label+"</span>";
        });

        svg.call(tip);

        var focus = plotArea.append("g")
            .style("display","none")
            .append("circle")
                .attr("r",1);

        var allSeries = plotArea.selectAll( ".plotSeries" ).data( data.series );

        allSeries.enter()
            .each( function() {
                var series = d3.select( this );
                var seriesLine = series.append( "g" )
                    .attr( "class", "plotSeries")
                    .attr( "series-name", function( d ) { return d.label; } )
                    .attr( "clip-path", "url(#"+clipId+")")
                    .append( "path" )
                        .attr( "class", "line" )
                        .attr( "d", function( d ) { return line( d.data ); } )
                        .style( "stroke", function( d ) { return colour( d.cKey ); } )    
                        .style( "fill", "none" )
                        .style( "stroke-width", "2.5px" )
                        //.attr( "clip-path", "url(#clip)")
                        .on( "mouseover", tipOn )
                        .on( "mouseout", tipOff );
        } );

        allSeries.each( function() {
            var series = d3.select( this );
            var seriesLine = series.select( "path.line" );
            seriesLine.transition()
                .attr( "d", function( d ) { return line( d.data ); } )
                .style( "stroke", function( d ) { return colour( d.cKey ); } )  ;
        } );

        allSeries.exit().remove();

        var xAxis = d3.axisBottom( xscale ).ticks(5);
        var yAxis = d3.axisLeft( yscale );

        var gX = plotArea.select(".axis--x");
        if ( gX.empty() ) {
            gX = plotArea.append("g")
                .attr( "transform", "translate(0," + height + ")" )
                .attr( "class", "axis--x")
                .call( xAxis );
            gX.append("text")
                .attr("fill", "#000")
                .attr("x", width)
                .attr("y", margin.bottom-2)
                .attr("text-anchor", "end")
                .text(layout.xAxisLabel);
        } else {
            gX.transition().call( xAxis );
        }

        var gY = plotArea.select(".axis--y");
        if ( gY.empty() ) {
            gY = plotArea.append("g")
                .attr( "class", "axis--y")
                .call( yAxis );
            gY.append("text")
                    .attr("fill", "#000")
                    .attr("transform", "rotate(-90)")
                    .attr("x", 0)
                    .attr("y", -margin.left + 15)
                    .attr("text-anchor", "end")
                    .text(layout.yAxisLabel);
        } else {
            gY.transition().call( yAxis );
        }

        function zoomed() {
            var t = d3.event.transform;
            xscale.domain(t.rescaleX(xscale0).domain());
            yscale.domain(t.rescaleY(yscale0).domain());
            gX.call(xAxis);
            gY.call(yAxis);
            plotArea.selectAll(".line").attr( "d", function( d ) { return line( d.data ); } );
        }

        function tipOn( d ) {
            lines.style( "opacity" , 0.2);
            d3.select(this)
                .style( "opacity" , 1.0)
                .style( "stroke-width", "4px" );
            focus
                .attr( "cx" , d3.mouse(this)[0] )
                .attr( "cy" , d3.mouse(this)[1] );
            tip.show( d , focus.node() );
            if ( layout.highlightTasks == true ) {
                dbsliceData.highlightTasks = [ d.taskId ];
                render( dbsliceData.elementId, dbsliceData.session, dbsliceData.config );
            }
        }

        function tipOff() {
            lines.style( "opacity" , 1.0);
            d3.select(this)
                .style( "stroke-width", "2.5px" );
            tip.hide();
            if ( layout.highlightTasks == true ) {
                dbsliceData.highlightTasks = [];
                render( dbsliceData.elementId, dbsliceData.session, dbsliceData.config );
            }
        }

        data.newData = false;
    }
};

export { d3LineSeries };