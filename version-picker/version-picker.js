/* global: d3 */
window.onload = function onLoad(){
    var
        RANGE_MIN = new Date("01/01/2004"),
        RANGE_MAX = new Date("31/12/2014"),
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
            new Date("01/01/2004"),
            new Date("12/31/2014"),
            Math.random() * 45 + 5
        ),
        
        x = d3.time.scale.utc()
            .domain([new Date("01-01-2004"), new Date("12-01-2014")])
            .range([10, 790]),
        
        // Let's add the X axis
        xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom'),

        versionPicker = d3.select('.version-picker')
            .append("svg")
            .attr("width", "100%")
            .attr("height", 100);

        versionPicker.append("line")
            .attr("x1", "0")
            .attr("y1", "50")
            .attr("x2", "100%")
            .attr("y2", "50")
            .attr("stroke", "#000")
            .attr("stroke-width", "1");
        
        versionPicker
            .selectAll('circle')
            .data(data)
            .enter().append('circle')
            .attr("cx", function csFn(d){
                return x(d);
            })
            .attr("cy", 50)
            .attr("r", 5)
            .attr("fill", "#D6C9C9")
            .attr("stroke", "#980606")
            .append("title")
            .text(function textFn(d){
                return d;
            })
            ;
};