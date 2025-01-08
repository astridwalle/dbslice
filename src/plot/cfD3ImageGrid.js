import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { refreshTasksInPlotRows } from '../core/refreshTasksInPlotRows.js';
import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3v7';

const cfD3ImageGrid = {

    make: function() {
        const container = d3.select(`#${this.elementId}`);
        container.html(""); // Clear any existing content

        const svgWidth = container.node().offsetWidth;
        const svgHeight = this.layout.height || 500; // Default height if none specified

        const imageWidth = this.layout.imageWidth || 100; // Default width for each image
        const imageHeight = this.layout.imageHeight || 100; // Default height for each image
        const margin = this.layout.margin || { top: 10, right: 10, bottom: 10, left: 10 };

        const svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`)
                .attr("class", "image-grid");

        this.update();
    },

    update: function() {
        const container = d3.select(`#${this.elementId}`);
        const svg = container.select("svg");

        const imagePaths = this.data.imagepath; // Access image paths from this.data.imagepath

        // Check if images are loaded
        imagePaths.forEach((path, index) => {
            const img = new Image();
            img.onload = () => {
            console.log(`Image ${index} loaded successfully: ${path}`);
            };
            img.onerror = () => {
            console.error(`Error loading image ${index}: ${path}`);
            };
            img.src = path;
        });
        
        const cfData = dbsliceData.session.cfData;
        const dimId = this.dimId;

        const images = svg.select(".image-grid").selectAll("image")
            .data(imagePaths, d => d); // Bind to paths directly

        images.enter()
            .append("image")
            .attr("href", d => d) // Use each entry in imagePaths as the path
            .attr("width", this.layout.imageWidth)
            .attr("height", this.layout.imageHeight)
            .attr("x", (d, i) => (i % this.layout.columns) * (this.layout.imageWidth + 10)) // Arrange in grid
            .attr("y", (d, i) => Math.floor(i / this.layout.columns) * (this.layout.imageHeight + 10))
            .style("cursor", "pointer")
            .on("click", (event, selectedItem) => {
                if (!cfData.filterSelected[dimId]) {
                    cfData.filterSelected[dimId] = [];
                }

                const selectedIndex = cfData.filterSelected[dimId].indexOf(selectedItem);
                if (selectedIndex !== -1) {
                    cfData.filterSelected[dimId].splice(selectedIndex, 1);
                } else {
                    cfData.filterSelected[dimId].push(selectedItem);
                }

                cfUpdateFilters(cfData);
                dbsliceData.allowAutoFetch = true;
                refreshTasksInPlotRows(true);
                dbsliceData.allowAutoFetch = false;
                this.update(); // Refresh the display
            })
            .transition()
                .attr("opacity", d => cfData.filterSelected[dimId]?.includes(d) ? 1 : 0.5);

        images.transition()
            .attr("opacity", d => cfData.filterSelected[dimId]?.includes(d) ? 1 : 0.5);

        images.exit().remove();
    },

};

export { cfD3ImageGrid };
