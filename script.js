// Set up dimensions
const width = 800, height = 500, margin = { top: 40, right: 40, bottom: 50, left: 60 };

// Append SVG to the page
const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

// Load data
d3.json("data/clinical_data_viz.json").then(data => {

    // Set up scales
    const xScale = d3.scaleLinear().range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);

    // Set up axes
    const xAxis = svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`);
    const yAxis = svg.append("g").attr("transform", `translate(${margin.left},0)`);

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
        xScale.domain(d3.extent(filteredData, d => d[predictor])).nice();
        yScale.domain(d3.extent(filteredData, d => d.los_postop)).nice();

        // Update axes
        xAxis.call(d3.axisBottom(xScale));
        yAxis.call(d3.axisLeft(yScale));

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
            .append("title")
            .text(d => `Age: ${d.age}, LOS: ${d.los_postop.toFixed(2)} days, Mortality: ${d.mortality_label}`);

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
