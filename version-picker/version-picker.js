/* global: d3 */
window.onload = function onLoad(){
    var
        RANGE_MIN = new Date("01/01/2004"),
        RANGE_MAX = new Date("12/31/2014"),
        MARGINS = 10,
        vis = d3.select('.version-picker'),
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
        },
        
        
        data = randomDates(
            RANGE_MIN,
            RANGE_MAX,
            Math.random() * 45 + 5
        ),
        
        xScale = d3.time.scale.utc()
            .domain([d3.min(data), d3.max(data)])
            .range([MARGINS, vis.node().offsetWidth - MARGINS]),
        
        // Let's add the X axis
        xAxis = d3.svg.axis()
            .scale(xScale)
            .orient('bottom'),

        keyFn = function keyFn(d){
            return +d;
        },

        cxFn = function cxFn(d){
            return ((xScale(+d) / vis.node().offsetWidth) * 100) + "%";
        };

    versionPicker = vis.append("svg")
        .attr("width", "100%")
        .attr("height", 100);

    versionPicker.append("line")
        .attr("x1", xScale(d3.min(data)))
        .attr("y1", "50")
        .attr("x2", xScale(d3.max(data)))
        .attr("y2", "50")
        .attr("stroke", "#000")
        .attr("stroke-width", "1");
    
    versionPicker.selectAll('circle')
        .data(data, keyFn)
        .enter().append('circle')
        .attr("cx", cxFn)
        .attr("cy", 50)
        .attr("r", 5)
        .attr("fill", "#D6C9C9")
        .attr("stroke", "#980606")
        .on("click", function clickFn(d){
            console.log(d);
            d3.selectAll("circle")
                .attr("r", 5)
                .attr("fill", "#D6C9C9");
            d3.select(d3.event.toElement)
                .attr("r", 10)
                .attr("fill", "#D7CF39");
        })
        .append("title")
        .text(function textFn(d){
            return d;
        });

    versionPicker.append("g")
        .attr("class", "axis")
        .call(xAxis)
        .attr("transform", "translate(0," + 78 + ")");

    // Implement resize handlers to update static parts
    window.addEventListener("resize", function resizeListener(event){
        if (event.stopPropagation){
            event.stopPropagation();
        }
        xScale.range([MARGINS, vis.node().offsetWidth - MARGINS]);
        versionPicker.select(".axis")
            .call(xAxis);
    });

    // Simulating a zoom-in
    versionPicker.on("click", function(){
        var zoomedData = [],
            minRangeDate = new Date("01/01/2010"),
            maxRangeDate = new Date("12/31/2012"),
            minRangeNum = (+minRangeDate),
            maxRangeNum = (+maxRangeDate),
            circles;
        
        // Change the data domain to the zoomed in region
        xScale.domain([minRangeDate, maxRangeDate]);
        
        // Updates the dataset
        data.forEach(function forEachFn(d){
            var mills = (+d);
            if (mills >= minRangeNum && mills <= maxRangeNum){
                zoomedData.push(new Date(d));
            }
        });
        
        // Applies the zoomed data set and gets reference to circles
        circles = versionPicker.selectAll("circle")
            .data(zoomedData, keyFn);
        
        // Updates the position of the circles in rage
        circles.transition()
            .duration(500)
            .attr("cx", cxFn);

        // Removes the circles out of new range
        circles.exit()
            .remove();

        // Updates the axis
        versionPicker.select(".axis")
            .call(xAxis);
    });
};