import { getDataFilterFunc } from '../filters/getDataFilterFunc.js';

function makePlotsFromPlotRowCtrl( ctrl ) {

	var plotPromises = [];

	var slicePromises = [];

	if ( ctrl.sliceIds === undefined ) {

		var nTasks = ctrl.taskIds.length;

		if ( ctrl.maxTasks !== undefined ) nTasks = Math.min( nTasks, ctrl.maxTasks );

		for ( var index = 0; index < nTasks; ++index ) {

			if ( ctrl.urlTemplate == null ) {

				var url = ctrl.taskIds[ index ];

			} else {

				var url = ctrl.urlTemplate.replace( "${taskId}", ctrl.taskIds[ index ] );

			}

			var title = ctrl.taskLabels[ index ];

       		var plotPromise = makePromiseTaskPlot( ctrl, url, title, ctrl.taskIds[ index ] ); 

        	plotPromises.push( plotPromise );

        }

    } else {

    	ctrl.sliceIds.forEach( function( sliceId, sliceIndex ) {

    		var plotPromise = makePromiseSlicePlot ( ctrl, sliceId, sliceIndex );

    		plotPromises.push( plotPromise );

    	});
    }

	return Promise.all(plotPromises);

}


function makePromiseTaskPlot( ctrl, url, title, taskId ) { 

	return fetch(url)

	.then(function( response ) {

        if ( ctrl.csv === undefined ) {

            return response.json();

        }

        if ( ctrl.csv == true ) {

            return response.text() ;

        }

    })

    .then(function( responseJson ) {

        if ( ctrl.csv == true ) {

            responseJson = d3.csvParse( responseJson );

        }

    	var plot = {};
        
        let dataFilterFunc;

        if (ctrl.dataFilterFunc !== undefined) {

            dataFilterFunc = ctrl.dataFilterFunc;

        }

        if (ctrl.formatDataFunc !== undefined) {

            dataFilterFunc = ctrl.formatDataFunc;
            
        }

        if (ctrl.dataFilterType !== undefined) {

            dataFilterFunc = getDataFilterFunc(ctrl.dataFilterType);

        }

    	if (dataFilterFunc !== undefined ) {

    		plot.data = dataFilterFunc( responseJson, taskId ); 

    	} else {

    		plot.data = responseJson;

        }

        plot.layout = Object.assign( {}, ctrl.layout );

        plot.plotFunc = ctrl.plotFunc;
        plot.plotType = ctrl.plotType;

        plot.layout.title = title;

        plot.layout.taskId = taskId;

        plot.data.newData = true;

        return plot;

    } );

}

function makePromiseSlicePlot( ctrl, sliceId, sliceIndex ) {

	var slicePromisesPerPlot = [];
    var tasksOnPlot = [];

	var nTasks = ctrl.taskIds.length;

	if ( ctrl.maxTasks !== undefined ) Math.min( nTasks, ctrl.maxTasks );

	for ( var index = 0; index < nTasks; ++index ) {

        tasksOnPlot.push( ctrl.taskIds[index] );

		var url = ctrl.urlTemplate
			.replace( "${taskId}", ctrl.taskIds[ index ] )
			.replace( "${sliceId}", sliceId );

            //console.log(url);

			var slicePromise = fetch(url).then( function( response ) {

				if ( ctrl.csv === undefined ) {

                    return response.json();

                }

                if ( ctrl.csv == true ) {

                    return response.text() ;

                }

			});

		slicePromisesPerPlot.push( slicePromise );

	}

    // slicePromises.push( slicePromisesPerPlot );

    return Promise.all( slicePromisesPerPlot ).then( function ( responseJson ) {

        if ( ctrl.csv == true ) {

            var responseCsv = [];

            responseJson.forEach( function(d) {

                responseCsv.push( d3.csvParse(d) );

            });

            responseJson = responseCsv;

        }

    	var plot = {};

        let dataFilterFunc;

        if (ctrl.dataFilterFunc !== undefined) {

            dataFilterFunc = ctrl.dataFilterFunc;

        }

        if (ctrl.formatDataFunc !== undefined) {

            dataFilterFunc = ctrl.formatDataFunc;
            
        }

        if (ctrl.dataFilterType !== undefined) {

            dataFilterFunc = getDataFilterFunc(ctrl.dataFilterType);

        }

    	if (dataFilterFunc !== undefined ) {

    		plot.data = dataFilterFunc( responseJson, tasksOnPlot );

    	} else {

    		plot.data = responseJson;

    	}

    	plot.layout = Object.assign({}, ctrl.layout);

        plot.layout.title = sliceId;

        if (ctrl.layout.xRange !== undefined) {

            if (ctrl.layout.xRange[1].length !== undefined) {

                plot.layout.xRange = ctrl.layout.xRange[sliceIndex];

            }

        }

        if (ctrl.layout.yRange !== undefined) {

            if (ctrl.layout.yRange[1].length !== undefined) {

                plot.layout.yRange = ctrl.layout.yRange[sliceIndex];

            }

        }

        if (ctrl.layout.xAxisLabel !== undefined) {

            if ( Array.isArray(ctrl.layout.xAxisLabel) ) {

                plot.layout.xAxisLabel = ctrl.layout.xAxisLabel[sliceIndex];

            }

        }

        if (ctrl.layout.yAxisLabel !== undefined) {

            if ( Array.isArray(ctrl.layout.yAxisLabel) ) {

                plot.layout.yAxisLabel = ctrl.layout.yAxisLabel[sliceIndex];

            }

        }

        if (ctrl.layout.title !== undefined) {

            if ( Array.isArray(ctrl.layout.title) ) {

                plot.layout.title = ctrl.layout.title[sliceIndex];

            }

        }

    	plot.plotFunc = ctrl.plotFunc;
        plot.plotType = ctrl.plotType;

    	plot.data.newData = true;

    	return plot;

    });

}

export { makePlotsFromPlotRowCtrl };