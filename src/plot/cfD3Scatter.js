import { dbsliceData } from '../core/dbsliceData.js';
import { highlightTasksAllPlots } from '../core/plot.js';
import * as d3 from 'd3v7';

const cfD3Scatter = {

    make : function() {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 53};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth,
            svgHeight = this.layout.height;

        this.dimId = dbsliceData.session.cfData.continuousProperties.indexOf( this.data.xProperty );

        var svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
                .attr( "transform", `translate(${margin.left} , ${margin.top})`)
                .attr( "class", "plot-area" )
                .attr( "id", `plot-area-${this._prid}-${this._id}`);

        container.append("div")
            .attr("class", "tool-tip")
            .style("opacity", 0);

        this.update();

    }, 

    update : function () {

        const layout = this.layout;

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 53};
        const margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        const svg = container.select("svg");

        svg.attr("width", svgWidth).attr("height", svgHeight);

        const clipId = `clip-${this._prid}-${this._id}`;

        const plotArea = svg.select(".plot-area");
        const dimId = this.dimId;

        const highlightTasks =layout.highlightTasks;

        const cfData = dbsliceData.session.cfData;
        const dim = cfData.continuousDims[ dimId ];
        const pointData = dim.top( Infinity );

        let xProperty = this.data.xProperty;
        let yProperty = this.data.yProperty;
        let cProperty = this.data.cProperty;

        if (this.layout.addSelectablePropertyToTitle) {
            const boundPropertySelectChange = propertySelectChange.bind(this);
            const plotTitle = d3.select(`#plot-title-text-${this._prid}-${this._id}`);
            let dropdownX = plotTitle.select(".property-dropdown-x");
            let dropdownY = plotTitle.select(".property-dropdown-y");
            let dropdownC = plotTitle.select(".property-dropdown-c");
            let selectIdX = `prop-select-x-${this._prid}-${this._id}`;
            let selectIdY = `prop-select-y-${this._prid}-${this._id}`;
            let selectIdC = `prop-select-c-${this._prid}-${this._id}`;
            let selectableOptions = cfData.continuousProperties;
            if (this.layout.selectableProperties !== undefined) {
            selectableOptions = this.layout.selectableProperties;
            }
            if (dropdownX.empty() || dropdownY.empty() || dropdownC.empty()) {
            let htmlX = 
                `<select name="${selectIdX}" id="${selectIdX}">
                ${selectableOptions.map(prop => `<option value="${prop}" ${prop==xProperty ? `selected`:``}>${prop}</option>`).join('')}
                </select>`;
            let htmlY = 
                `<select name="${selectIdY}" id="${selectIdY}">
                ${selectableOptions.map(prop => `<option value="${prop}" ${prop==yProperty ? `selected`:``}>${prop}</option>`).join('')}
                </select>`;
            let htmlC = 
                `<select name="${selectIdC}" id="${selectIdC}">
                ${selectableOptions.map(prop => `<option value="${prop}" ${prop==cProperty ? `selected`:``}>${prop}</option>`).join('')}
                </select>`;
            plotTitle.html("")
                .append("div")
                .attr("class","property-dropdown-x")
                .html(htmlX);
            plotTitle.append("div")
                .attr("class","property-dropdown-y")
                .html(htmlY);
            plotTitle.append("div")
                .attr("class","property-dropdown-c")
                .html(htmlC);
            document.getElementById(selectIdX).addEventListener("change", boundPropertySelectChange);
            document.getElementById(selectIdY).addEventListener("change", boundPropertySelectChange);
            document.getElementById(selectIdC).addEventListener("change", boundPropertySelectChange);
            }
        } else {
            const plotTitle = d3.select(`#plot-title-text-${this._prid}-${this._id}`);
            let dropdownX = plotTitle.select(".property-dropdown-x");
            let dropdownY = plotTitle.select(".property-dropdown-y");
            let dropdownC = plotTitle.select(".property-dropdown-c");
            dropdownX.remove();
            dropdownY.remove();
            dropdownC.remove();
            plotTitle.html(this.layout.title);
        }

        function propertySelectChange(event) {
            const selectId = event.target.id;
            if (selectId.includes("x")) {
            this.data.xProperty = event.target.value;
            } else if (selectId.includes("y")) {
            this.data.yProperty = event.target.value;
            } else if (selectId.includes("c")) {
            this.data.cProperty = event.target.value;
            }
            this.update();
        }

        let xRange, yRange;
        if ( layout.xRange === undefined) {
            if ( !layout.noAxesAutoScale ) {
                let xMin = d3.min( pointData, d => d[ xProperty ] );
                let xMax = d3.max( pointData, d => d[ xProperty ] );
                let xDiff = xMax - xMin;
                xMin -= 0.1 * xDiff;
                xMax += 0.1 * xDiff;
                xRange = [xMin, xMax];
            } else {
                let extent = cfData.continuousDimsExtents[dimId];
                let xMin = extent[0];
                let xMax = extent[1];
                let xDiff = xMax - xMin;
                xMin -= 0.1 * xDiff;
                xMax += 0.1 * xDiff;
                xRange = [xMin, xMax];
            }
        } else {
            xRange = layout.xRange;
        }

        if ( layout.yRange === undefined) {
            if ( !layout.noAxesAutoScale ) {
                let yMin = d3.min( pointData, d => d[ yProperty ] );
                let yMax = d3.max( pointData, d => d[ yProperty ] );
                let yDiff = yMax - yMin;
                yMin -= 0.1 * yDiff;
                yMax += 0.1 * yDiff;
                yRange = [yMin, yMax];
            } else {
                let yDimId = dbsliceData.session.cfData.continuousProperties.indexOf( yProperty );
                let extent = cfData.continuousDimsExtents[yDimId];
                let yMin = extent[0];
                let yMax = extent[1];
                let yDiff = yMax - yMin;
                yMin -= 0.1 * yDiff;
                yMax += 0.1 * yDiff;
                yRange = [yMin, yMax];
            }
        } else {
            yRange = layout.yRange;
        }

        const xscale = d3.scaleLinear()
            .range( [0, width] )
            .domain( xRange );

        const xscale0 = d3.scaleLinear()
            .range( [0, width] )
            .domain( xRange );

        const yscale = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        const yscale0 = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

       // Check if cProperty is continuous or categorical, or undefined
       let colorScale;
       if (cProperty) {
           if (cfData.continuousProperties.includes(cProperty)) {
               // If cProperty is continuous, use a linear color scale
               const colorRange = layout.colorRange || ["#0000FF", "#FF0000"]; // Default blue to red
               colorScale = d3.scaleSequential(d3.interpolateViridis)
                   .domain(d3.extent(pointData, d => d[cProperty]));
                   //.range(colorRange);
           } else {
               // If cProperty is categorical, use an ordinal color scale
               const uniqueValues = cfData.categoricalUniqueValues[cProperty] || [];
               colorScale = d3.scaleOrdinal(layout.colorMap || d3.schemeTableau10)
                   .domain(uniqueValues);
           }
       }            
        //const colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeTableau10 ) : d3.scaleOrdinal( layout.colourMap );
        //colour.domain( cfData.categoricalUniqueValues[ cProperty ] );

        const opacity = ( layout.opacity === undefined ) ? 1.0 : layout.opacity;

        const clipRect = svg.select(".clip-rect");

        if ( clipRect.empty() ) {
            svg.append("defs").append("clipPath")
                .attr("id", clipId)
                .append("rect")
                    .attr("class","clip-rect")
                    .attr("width", width)
                    .attr("height", height);
        } else {
            clipRect.attr("width", width)
        }

        var zoom = d3.zoom()
            .scaleExtent([0.01, Infinity])
            .on("zoom", zoomed);

        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);

        let focus = plotArea.select(".focus");
        if ( focus.empty() ) {
            plotArea.append("circle")
                .attr("class","focus")
                .attr("fill","none")
                .attr("r",1);
        }

        const points = plotArea.selectAll( ".point" )
            .data( pointData );

        points.enter()
            .append( "circle" )
            .attr( "class", "point")
            .attr( "r", 5 )
            .attr( "cx", d => xscale( d[ xProperty ] ))
            .attr( "cy", d => yscale( d[ yProperty ] ))
            .style( "fill", d => cProperty ? colorScale( d[ cProperty ] ) : "#d3d3d3") // Default to gray if no color property
            .style( "opacity", opacity )
            .attr( "clip-path", `url(#${clipId})`)
            .attr( "task-id", d => d.taskId )
            .on( "mouseover", tipOn )
            .on( "mouseout", tipOff );
 
        points
            .attr( "r", 5 )
            .attr( "cx", d => xscale( d[ xProperty ] ))
            .attr( "cy", d => yscale( d[ yProperty ] ))
            .style( "fill", d => colorScale( d[ cProperty ] ))
            .attr( "task-id", d => d.taskId )
      

        points.exit().remove();

        // Add legend
        const legendHeight = 200;
        const legendWidth = 20;

        const legend = plotArea.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width + margin.right - legendWidth}, 10)`);

        const legendScale = d3.scaleLinear()
            .domain(colorScale.domain())
            .range([legendHeight, 0]);

        const legendAxis = d3.axisRight(legendScale)
            .ticks(3); // Set the number of ticks to 3 for min, middle, and max

        legend.append("g")
            .attr("class", "axis")
            .call(legendAxis);

        const legendGradient = legend.append("defs")
            .append("linearGradient")
            .attr("id", "legendGradient")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "0%")
            .attr("y2", "0%");

        // Add stops for the legend gradient based on d3.interpolateViridis
        const legendStops = d3.range(0, 1.01, 0.1).map(d => ({
            offset: `${d * 100}%`,
            color: d3.interpolateViridis(d)
        }));

        legendStops.forEach(stop => {
            legendGradient.append("stop")
            .attr("offset", stop.offset)
            .attr("stop-color", stop.color);
        });

        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legendGradient)");

        // Remove old legend label if it exists
        plotArea.selectAll(".legend-label").remove();

        // Add cProperty label
        legend.append("text")
            .attr("class", "legend-label")
            .attr("x", legendWidth / 2)
            .attr("y", legendHeight + 30)
            .attr("text-anchor", "middle")
            .text(this.data.cProperty);

        const line = d3.line()
            .x( d => xscale( d[xProperty] ))
            .y( d => yscale( d[yProperty] ));

        if ( layout.groupBy !== undefined ) {
            const keys = layout.groupBy.map( v => (d => d[v]) );
            const group = d3.group(pointData, ...keys);
            const joiningLines = getLines(group);
            let sortedJoiningLines;
            if ( layout.orderBy !== undefined ) {
                sortedJoiningLines = joiningLines.map( d => d3.sort(d, d=>d[layout.orderBy]));
            } else {
                sortedJoiningLines = joiningLines.map( d => d3.sort(d, d=>d[xProperty]));
            }
            plotArea.selectAll(".joining-line").remove();
            const lines = plotArea.selectAll(".joining-lines").data(sortedJoiningLines);

            lines.enter()
                .append( "path" )
                .attr( "class", "joining-line" )
                    .attr( "d", d => line(d))
                    .style( "stroke", "#848484" )    
                    .style( "fill", "none" )
                    .style( "stroke-width", "2.5px" )
                    .attr( "clip-path", `url(#${clipId})`)
                    .lower();
        }

        const xAxis = d3.axisBottom( xscale );
        if ( layout.xTickNumber !== undefined ) { xAxis.ticks(layout.xTickNumber); }
        if ( layout.xTickFormat !== undefined ) { xAxis.tickFormat(d3.format(layout.xTickFormat)); }

        const yAxis = d3.axisLeft( yscale );
        if ( layout.yTickNumber !== undefined ) { yAxis.ticks(layout.yTickNumber); }
        if ( layout.yTickFormat !== undefined ) { yAxis.tickFormat(d3.format(layout.yTickFormat)); }

        let gX = plotArea.select(".axis-x");
        if ( gX.empty() ) {
            gX = plotArea.append("g")
            .attr( "transform", `translate(0,${height})` )
            .attr( "class", "axis-x")
            .call( xAxis );
            gX.append("text")
            .attr("class","x-axis-text")
            .attr("fill", "#000")
            .attr("x", width)
            .attr("y", margin.bottom-2)
            .attr("text-anchor", "end")
            .text(this.data.xProperty);
        } else {
            gX.transition().call( xAxis );
            gX.select(".x-axis-text")
            .attr("x", width)
            .text(this.data.xProperty); // Update the x-axis label text
        }

        let gY = plotArea.select(".axis-y");
        if ( gY.empty() ) {
            gY = plotArea.append("g")
            .attr( "class", "axis-y")
            .call( yAxis );
            gY.append("text")
            .attr("class", "y-axis-text")
            .attr("fill", "#000")
            .attr("transform", "rotate(-90)")
            .attr("x", 0)
            .attr("y", -margin.left + 15)
            .attr("text-anchor", "end")
            .text(this.data.yProperty);
        } else {
            gY.transition().call( yAxis );
            gY.select(".y-axis-text")
            .text(this.data.yProperty); // Update the y-axis label text
        }


        function zoomed(event) {
            var t = event.transform;
            if (!layout.xAxisZoomOff) {
                xscale.domain(t.rescaleX(xscale0).domain());
                gX.call(xAxis);
            }
            if (!layout.yAxisZoomOff) {
                yscale.domain(t.rescaleY(yscale0).domain());
                gY.call(yAxis);
            }
            plotArea.selectAll(".point")
                .attr( "cx", d => xscale( d[ xProperty ] ) )
                .attr( "cy", d => yscale( d[ yProperty ] ) );
            plotArea.selectAll(".joining-line").attr( "d", d => line(d) );
        }

        function tipOn( event, d ) {
            plotArea.selectAll( ".point" ).style( "opacity" , 0.4);
            let target = d3.select(event.target);
            target
                .style( "opacity" , 1.0)
                .attr( "r", 7 );

            let toolTipText, xVal, yVal;
            if ( layout.toolTipXFormat === undefined ) {
                xVal = d[ xProperty ];
            } else {
                xVal = d3.format(layout.toolTipXFormat)( d[ xProperty ] )
            }
            if ( layout.toolTipYFormat === undefined ) {
                yVal = d[ yProperty ];
            } else {
                yVal = d3.format(layout.toolTipYFormat)( d[ yProperty ] )
            }
            let valsText = `${xProperty}=${xVal}, ${yProperty}=${yVal}`;

            if ( layout.toolTipProperties === undefined ) {
                toolTipText = `${d.label}: ${valsText}`; 
            } else {
                let props = layout.toolTipProperties.map(prop => d[prop]);
                toolTipText = props.join("; ");
                toolTipText += `: ${valsText}`;
            }
           
            container.select(".tool-tip")
                .style("opacity", 1.0)
                .html(`<span>${toolTipText}</span>`)
                .style("left", target.attr("cx")+ "px")
                .style("top", target.attr("cy")-30 + "px");
       
            if ( highlightTasks ) {
                dbsliceData.highlightTasks = [ d.taskId ];
                highlightTasksAllPlots();
            }
        }

        function tipOff(event, d) {
            plotArea.selectAll( ".point" ).style( "opacity" , opacity );
            d3.select(event.target)
                .attr( "r", 5 );
            container.select(".tool-tip").style("opacity", 0.0)
            if ( highlightTasks ) {
                dbsliceData.highlightTasks = [];
                highlightTasksAllPlots();
            }
        }
        
        function getLines(map) {
            let lines=[];
            map.forEach( d => {
              if (d instanceof Map) {
                lines=[...lines,...getLines(d)];
              } else {
                if (d.length>1) {
                  lines.push(d);
                }
              }
            });
            return lines;          
        }
    },

    highlightTasks : function(){

        if (!this.layout.highlightTasks) return;

        const cfData = dbsliceData.session.cfData;
        const plotArea = d3.select(`#plot-area-${this._prid}-${this._id}`);
        const opacity = ( this.layout.opacity === undefined ) ? 1.0 : this.layout.opacity;
        const cProperty = this.data.cProperty;
        const colour = ( this.layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeTableau10 ) : d3.scaleOrdinal( this.layout.colourMap );
        colour.domain( cfData.categoricalUniqueValues[ cProperty ] );
        const points = plotArea.selectAll( ".point" );

        const joiningLines = plotArea.selectAll(".joining-line");

        if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {
            points
                .style( "opacity" , opacity )
                .style( "stroke-width", "0px")
                .style( "fill", d => colour( d[ cProperty ] ));
            joiningLines
                .style( "opacity" , 1.0)
                .style( "stroke-width", "2.5px");
        } else {
            points.style( "opacity" , 0.6);
            points.style( "fill" , "#d3d3d3");
            joiningLines
                .style( "opacity" , 0.6)
                .style( "stroke-width", "1px");
            dbsliceData.highlightTasks.forEach( function (taskId) {
                points.filter( (d,i) => d.taskId == taskId)
                    .style( "fill", d => colour( d[ cProperty ] )  )
                    .style( "opacity" , opacity)
                    .style( "stroke", "red")
                    .style( "stroke-width", "2px")
                    .raise();
                joiningLines.filter( (d,i) => d.map( d => d.taskId ).includes(taskId))
                    .style( "opacity" , 1.0)
                    .style( "stroke-width", "2.5px");
            });
        }
    }



};

export { cfD3Scatter };