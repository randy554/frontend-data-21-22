import {
  getSourceFrmList,
  listByOccurrenceCount,
  removeWordFromValue,
  uppercaseFirstLetterValueFromList,
} from "./modules/dataCleaning.js";

// Set API endpoint parameters
let apiKey = "d08928de0d5d4809aef8375899851622";
let phrases = "Corona";
let language = "nl";
let sortBy = "relevancy";
let pageSize = 100;
let page = 1;
let fullDataset = [];
let newsSource1 = "www.ad.nl";
let newsSource2 = "telegraaf.nl";
let allNewsEndPoint = `https://newsapi.org/v2/everything?qInTitle=${phrases}&language=${language}&page=${page}&pageSize=${pageSize}&apiKey=${apiKey}`;
let fromTwoSourcesEndPoint = `https://newsapi.org/v2/everything?qInTitle=${phrases}&language=${language}&page=${page}&pageSize=${pageSize}&domains=${newsSource1},${newsSource2}&apiKey=${apiKey}`;
let oldApiEndpoint =
  "https://rawgit.com/sgratzl/d3tutorial/master/examples/weather.json";

const margin = { top: 40, bottom: 10, left: 120, right: 20 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Creates sources <svg> element
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

// Group used to enforce margin
const g = svg
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Global variable for all data
let data;

// Scales setup
const xscale = d3.scaleLinear().range([0, width]);
const yscale = d3.scaleBand().rangeRound([0, height]).paddingInner(0.1);

// Axis setup
const xaxis = d3.axisTop().scale(xscale);
const g_xaxis = g.append("g").attr("class", "x axis");
const yaxis = d3.axisLeft().scale(yscale);
const g_yaxis = g.append("g").attr("class", "y axis");

/////////////////////////

d3.json(allNewsEndPoint).then((json) => {
  data = json;

  let sourceL = getSourceFrmList(data.articles);
  console.log("List with sources:", sourceL);
  let withoutW = removeWordFromValue(sourceL, "Www.", "");
  console.log("List with wwww:", withoutW);
  let capFirstL = uppercaseFirstLetterValueFromList(withoutW);
  console.log("List with first letter cap:", capFirstL);
  let newList = listByOccurrenceCount(capFirstL);
  console.log("List by source:", newList);

  update(newList);
});

function update(new_data) {
  //update the scales
  xscale.domain([0, d3.max(new_data, (d) => d.articleCount)]);
  yscale.domain(new_data.map((d) => d.sourceName));
  //render the axis
  g_xaxis.transition().call(xaxis);
  g_yaxis.transition().call(yaxis);

  // Render the chart with new data

  // DATA JOIN use the key argument for ensurign that the same DOM element is bound to the same data-item
  const rect = g
    .selectAll("rect")
    .data(new_data, (d) => d.sourceName)
    .join(
      // ENTER
      // new elements
      (enter) => {
        const rect_enter = enter.append("rect").attr("x", 0);
        rect_enter.append("title");
        return rect_enter;
      },
      // UPDATE
      // update existing elements
      (update) => update,
      // EXIT
      // elements that aren't associated with data
      (exit) => exit.remove()
    );

  // ENTER + UPDATE
  // both old and new elements
  rect
    .transition()
    .attr("height", yscale.bandwidth())
    .attr("width", (d) => xscale(d.articleCount))
    .attr("y", (d) => yscale(d.sourceName));

  rect.select("title").text((d) => d.sourceName);
}

//interactivity
d3.select("#filter-us-only").on("change", function () {
  // This will be triggered when the user selects or unselects the checkbox
  const checked = d3.select(this).property("checked");
  if (checked === true) {
    // Checkbox was just checked

    // Keep only data element whose country is US
    const filtered_data = data.filter((d) => d.location.country === "US");

    update(filtered_data); // Update the chart with the filtered data
  } else {
    // Checkbox was just unchecked
    update(data); // Update the chart with all the data we have
  }
});
