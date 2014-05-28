/* global: d3 */
window.onload = function onLoad(){
    var exports;
    function versionPicker(){
        var
            RANGE_MIN = new Date("01/01/2004"),
            RANGE_MAX = new Date("12/31/2014"),
            MARGINS = 10,
            vis = d3.select('.version-picker'),
            visWidth = vis.node().offsetWidth,
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
                .range([MARGINS, visWidth - MARGINS]),
            
            // Let's add the X axis
            xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom'),

            /* Receives a value representing the coordinate on the X, and maps that
            to a Date corresponding to the visualization xScale.
             */
            xToDate = function xToDate(xScale, x){
                if (typeof xScale === "function"){
                    return xScale.invert(x);
                }
            },

            keyFn = function keyFn(d){
                return +d;
            },

            cxFn = function cxFn(d){
                return ((xScale(d) / visWidth) * 100) + "%";
            },

            zoomHandler = (function zoomHandler(){
                var
                    MAX_ZOOMS = 4,
                    zoomings = [];
                return function zoomHandlerClosure(factor){
                    var zoomedData = [],
                        isZoomIn = factor > 0,
                        zoom = isZoomIn ? 250 : 750,
                        clientX = d3.event.clientX,
                        minRangeDate = xScale.invert(clientX - zoom),
                        maxRangeDate = xScale.invert(clientX + zoom),
                        minRangeNum = (+minRangeDate),
                        maxRangeNum = (+maxRangeDate),
                        circles;

                    
                    // Updates the dataset
                    if (isZoomIn){
                        if (zoomings.length > MAX_ZOOMS){
                            return;
                        }

                        data.forEach(function forEachFn(d){
                            var mills = (+d);
                            if (mills >= minRangeNum && mills <= maxRangeNum){
                                zoomedData.push(new Date(d));
                            }
                        });

                        zoomings.push({
                            domain: xScale.domain(),
                            data: zoomings.length ? zoomedData : data
                        });

                        // Change the data domain to the zoomed in region
                        xScale.domain([minRangeDate, maxRangeDate]);
                    }
                    else { // zoom out
                        if (zoomings.length === 0){
                            return;
                        }
                        (function zoomOutFn(){
                            // Updates zommings removing last one
                            var popZoom = zoomings.pop();
                            xScale.domain(popZoom.domain);
                            zoomedData = popZoom.data;
                        }());
                        
                    }
                    
                    // Applies the zoomed data set and gets reference to circles
                    circles = svg.selectAll("circle")
                        .data(zoomedData, keyFn);
                    
                    // Updates the position of the circles in rage
                    circles.transition()
                        .duration(500)
                        .attr("cx", cxFn);

                    // Adds back missing circles on zooming out
                    circles.enter().append('circle')
                        .attr("cx", cxFn)
                        .attr("cy", 50)
                        .attr("r", 5)
                        .attr("fill", "#D6C9C9")
                        .attr("stroke", "#980606");

                    // Removes the circles out of new range
                    circles.exit()
                        /*.transition()
                        .duration(500)
                        .attr("cx", (function xFn(d){
                            var popZoom = zoomings[zoomings.length - 1],
                                xScale = d3.time.scale.utc().domain(popZoom.domain);
                            return function(d){
                                return +d > +xScale.invert(clientX) ? visWidth : 0;
                            };
                        }()))*/
                        .remove();

                    // Updates the axis
                    svg.select(".axis")
                        .call(xAxis);
                };
            }()),

            svg = vis.append("svg")
                .attr("width", "100%")
                .attr("height", 100);

        svg.append("line")
            .attr("x1", xScale(d3.min(data)))
            .attr("y1", "50")
            .attr("x2", xScale(d3.max(data)))
            .attr("y2", "50")
            .attr("stroke", "#000")
            .attr("stroke-width", "1");
        
        svg.selectAll('circle')
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

        svg.append("g")
            .attr("class", "axis")
            .call(xAxis)
            .attr("transform", "translate(0," + 78 + ")");

        // Implement resize handlers to update static parts
        window.addEventListener("resize", function resizeListener(event){
            if (event.stopPropagation){
                event.stopPropagation();
            }
            // Updates the visualization width reference
            visWidth = vis.node().offsetWidth;
            
            xScale.range([MARGINS, visWidth - MARGINS]);
            svg.select(".axis")
                .call(xAxis);
        });

        svg.on("wheel", function(){
            zoomHandler(d3.event.wheelDelta);
        });

        return {
            testing: {
                xToDate: xToDate
            }
        };
    }

    // Runs the visualization
    exports = versionPicker();
    // Tests
    (function tests(){
        var xToDate = exports.testing.xToDate,
            test = function test(assertion, message, context, args){
                var result = (typeof assertion === "function" ?
                        assertion.apply(context, args) : {check: assertion});
                console.log(
                    result.check ? "Pass." : "## Fail! " +
                        (typeof message === "function" ?
                            message(result) : message)
                );
            };

        test(
            void(0) === xToDate(),
            "Passing undefined should return undefined"
        );

        // Tests the xToDate
        (function firstLastScaleTest(){
            var
                firstDate = new Date("01/01/2014"),
                lastDate = new Date("01/02/2014"),
                xScale = d3.time.scale.utc()
                    .domain([
                        firstDate,
                        lastDate
                    ])
                    .range([0, 100]);
        
            test(
                function firstItemMatchTest(){
                    var
                        returnValue = +xToDate(xScale, 0);

                    return {
                        check: returnValue === (+firstDate),
                        value: returnValue
                    };
                },
                function (result){
                    return "expected 01/01/2014 but was: " + result.value;
                }
            );

            test(
                function firstItemMatchTest(){
                    var
                        returnValue = +xToDate(xScale, 100);

                    return {
                        check: returnValue === (+lastDate),
                        value: returnValue
                    };
                },
                function (result){
                    return "expected 01/02/2014 but was: " + result.value;
                }
            );
        }());

    }());
};