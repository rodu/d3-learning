/* global: d3 */
window.onload = function onLoad(){
    var
        randomDates = function randomDates(minDate, maxDate, numEntries) {
            var min = minDate.getTime(),
            max = maxDate.getTime(),
            seed = max - min,
            datesRange = [];
            while (datesRange.length < numEntries){
                datesRange.push(
                    new Date(parseInt(Math.random() * seed + min, 10))
                );
            }
            return datesRange.sort();
        };
        
        data = randomDates(
            new Date("01/01/2014"),
            new Date("12/31/2014"),
            25
        ),
        
        x = d3.time.scale.utc()
            .domain([new Date("01-01-2014"), new Date("11-01-2014")])
            .range([10, 790]),
        
        // Let's add the X axis
        xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom'),

        versionPicker = d3.select('.version-picker')
            .append("svg")
            .attr("width", "100%")
            .attr("height", 100)
            .selectAll('circle')
            .data(data)
            .enter().append('circle')
            .attr("cx", function csFn(d){
                return x(d);
            })
            .attr("cy", 50)
            .attr("r", 5)
            .attr("fill", "#DA9090")
            .attr("stroke", "#980606")
            .append("title")
            .text(function textFn(d){
                return d;
            })
            ;
};