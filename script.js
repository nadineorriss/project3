// Set up dimensions
const width = 800, height = 500, margin = { top: 40, right: 40, bottom: 50, left: 60 };

// Append SVG to the page
const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

// Create a tooltip div (hidden initially)
const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid black")
    .style("border-radius", "5px")
    .style("padding", "8px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

// Load data
d3.json("data/clinical_data_viz.json").then(data => {

    // Set up scales
    const xScale = d3.scaleLinear().range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);

    // Set up axes
    const xAxisGroup = svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`);
    const yAxisGroup = svg.append("g").attr("transform", `translate(${margin.left},0)`);

    // Axis labels
    const xAxisLabel = svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Predictor");

    const yAxisLabel = svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left - 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Length of Stay (LOS)");

    // Function to update the scatter plot
    function updateChart() {
        const predictor = document.getElementById("predictor").value;
        const selectedASA = document.getElementById("asa").value;
        const selectedApproach = document.getElementById("approach").value;

        // Filter data based on dropdown selections
        let filteredData = data.filter(d => 
            (selectedASA === "all" || d.asa == selectedASA) &&
            (selectedApproach === "all" || d.approach === selectedApproach)
        );

        // Update scales based on selected predictor
        if (predictor === "sex") {
            xScale.domain(["M", "F"]);
        } else {
            xScale.domain(d3.extent(filteredData, d => d[predictor])).nice();
        }
        yScale.domain(d3.extent(filteredData, d => d.los_postop)).nice();

        // Update axes
        xAxisGroup.call(d3.axisBottom(xScale));
        yAxisGroup.call(d3.axisLeft(yScale));

        // Update axis labels
        xAxisLabel.text(predictor.charAt(0).toUpperCase() + predictor.slice(1));

        // Bind data to circles
        const circles = svg.selectAll("circle")
            .data(filteredData, d => d.id);

        // Enter new circles
        circles.enter().append("circle")
            .attr("cx", d => xScale(d[predictor]))
            .attr("cy", d => yScale(d.los_postop))
            .attr("r", 5)
            .attr("fill", d => d.color)
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) { // Tooltip appears on hover
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`
                    <strong>Age:</strong> ${d.age} years<br>
                    <strong>Sex:</strong> ${d.sex}<br>
                    <strong>LOS:</strong> ${d.los_postop.toFixed(2)} days<br>
                    <strong>ASA Status:</strong> ${d.asa}<br>
                    <strong>Approach:</strong> ${d.approach}<br>
                    <strong>Mortality:</strong> ${d.mortality_label}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
            })
            .on("mousemove", function(event) { // Move tooltip with cursor
                tooltip.style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() { // Hide tooltip when mouse leaves
                tooltip.transition().duration(200).style("opacity", 0);
            });

        // Update existing circles
        circles
            .attr("cx", d => xScale(d[predictor]))
            .attr("cy", d => yScale(d.los_postop))
            .attr("fill", d => d.color);

        // Remove old circles
        circles.exit().remove();
    }

    // Attach event listeners to dropdowns
    document.getElementById("predictor").addEventListener("change", updateChart);
    document.getElementById("asa").addEventListener("change", updateChart);
    document.getElementById("approach").addEventListener("change", updateChart);

    // Initial chart rendering
    updateChart();
});
