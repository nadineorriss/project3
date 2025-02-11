const margin = { top: 40, right: 40, bottom: 50, left: 60 };

function getChartWidth() {
    return Math.max(Math.min(window.innerWidth * 0.8, 800), 500);
}

let width = getChartWidth(), height = 500;

const svg = d3.select("#chart")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("width", width)
    .attr("height", height);

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

const asaDescriptions = {
    "1": "ASA I (Green): Normal healthy patient.",
    "2": "ASA II (Blue): Mild systemic disease.",
    "3": "ASA III (Yellow): Severe systemic disease.",
    "4": "ASA IV (Red): Severe systemic disease, constant threat to life.",
    "all": "All ASA Classes: Showing all patient groups."
};

const xAxisLabels = {
    "age": "Age (years)",
    "bmi": "BMI (kg/m²)",
    "intraop_ebl": "Blood Loss (mL)",
    "surgery_duration": "Surgery Duration (minutes)"
};

d3.json("data/clinical_data_viz.json").then(data => {
    let xScale = d3.scaleLinear().range([margin.left, width - margin.right]);
    let yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);

    const xAxisGroup = svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`);
    const yAxisGroup = svg.append("g").attr("transform", `translate(${margin.left},0)`);

    const xAxisLabel = svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px");

    const yAxisLabel = svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left - 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Length of Stay (days)");

    function updateChart() {
        width = getChartWidth();
        svg.attr("width", width);

        const predictor = document.getElementById("predictor").value;
        const selectedASA = document.getElementById("asa").value;
        const selectedApproach = document.getElementById("approach").value;

        document.getElementById("asa-description").innerHTML = `<strong>ASA Status:</strong> ${asaDescriptions[selectedASA]}`;

        let filteredData = data.filter(d =>
            (selectedASA === "all" || d.asa == selectedASA) &&
            (selectedApproach === "all" || d.approach === selectedApproach)
        );

        if (filteredData.length === 0) {
            xScale.domain([0, 100]);
            yScale.domain([0, 10]);
        } else {
            xScale.domain(d3.extent(filteredData, d => d[predictor])).nice();
            yScale.domain(d3.extent(filteredData, d => d.los_postop)).nice();
        }

        xAxisGroup.call(d3.axisBottom(xScale));
        yAxisGroup.call(d3.axisLeft(yScale));

        xAxisLabel.text(xAxisLabels[predictor] || predictor).attr("x", width / 2);

        const circles = svg.selectAll("circle").data(filteredData, d => d.id);

        circles.enter()
            .append("circle")
            .merge(circles)
            .attr("cx", d => xScale(d[predictor]))
            .attr("cy", d => yScale(d.los_postop))
            .attr("r", 5)
            .attr("fill", d => d.color)
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
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
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition().duration(200).style("opacity", 0);
            });

        circles.exit().remove();
    }

    window.addEventListener("resize", updateChart);
    document.getElementById("predictor").addEventListener("change", updateChart);
    document.getElementById("asa").addEventListener("change", updateChart);
    document.getElementById("approach").addEventListener("change", updateChart);

    updateChart();
});