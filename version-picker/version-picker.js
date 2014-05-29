/* global: d3 */
window.onload = function onLoad(){
    var exports;
    function versionPicker(){
        var
            RANGE_MIN = new Date('01/01/2004'),
            RANGE_MAX = new Date('12/31/2014'),
            master,
            compare,
            MARGINS = 10,
            CIRCLE_RAY = 5,
            CIRCLE_SELECTED_RAY = 10,
            CIRCLE_FILL = '#D6C9C9',
            CIRCLE_SELECTED_FILL = '#EDECB2',
            vis = d3.select('.version-picker'),
            visWidth = vis.node().offsetWidth,
            visHeight = vis.node().offsetHeight,
            randomDates = function randomDates(minDate, maxDate, numEntries) {
                var min = minDate.getTime(),
                max = maxDate.getTime(),
                seed = max - min,
                datesRange = [];
                while (datesRange.length < numEntries){
                    datesRange.push({
                        date: new Date(parseInt(Math.random() * seed + min, 10))
                    });
                }
                return datesRange.sort(function sortFn(a, b){
                    return (+a) - (+b);
                });
            },
            data = randomDates(
                RANGE_MIN,
                RANGE_MAX,
                Math.random() * 45 + 5
            ),
            dateAccessor = function dateAccessor(d){
                return d.date;
            },
            xScale = d3.time.scale.utc()
                .domain([
                    d3.min(data, dateAccessor),
                    d3.max(data, dateAccessor)
                ])
                .range([MARGINS, visWidth - MARGINS]),
            
            // Let's add the X axis
            xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom'),

            /* Receives a value representing the coordinate on the X, and maps that
            to a Date corresponding to the visualization xScale.
             */
            xToDate = function xToDate(xScale, x){
                if (typeof xScale === 'function'){
                    return xScale.invert(x);
                }
            },

            keyFn = function keyFn(d){
                return +d.date;
            },

            cxFn = function cxFn(d){
                return ((xScale(d.date) / visWidth) * 100) + '%';
            },

            appendCircles = function appendCircles(selectionFn){
                selectionFn().append('circle')
                    .attr('cx', cxFn)
                    .attr('cy', 50)
                    .attr('r', CIRCLE_RAY)
                    .attr('fill', CIRCLE_FILL)
                    .attr('stroke', '#980606')
                    .attr('data-selected', 'false')
                    .on('click', function clickFn(d){
                        var el = d3.select(this);
                        //console.log(d);

                        // Reset previously selected master
                        if (master){
                            master
                                /*.filter(function filterFn(d){
                                    return d.master;
                                })*/
                                .datum(function datumFn(d){
                                    d.master = false;
                                })
                                .attr('r', CIRCLE_RAY)
                                .attr('fill', CIRCLE_FILL);
                        }
                        
                        // Sets the properties for this circle to be the master
                        console.log("data", el.datum());
                        
                            /*.datum(function datumFn(d){
                                d.master = true;
                                console.log(d);
                            })
                            .attr('r', CIRCLE_SELECTED_RAY)
                            .attr('fill', CIRCLE_SELECTED_FILL);*/

                        // Stores reference to current master
                        master = d3.select(this);
                    })
                    .append('title')
                    .text(function textFn(d){
                        return d.date;
                    });
            },

            zoomHandler = (function zoomHandler(){
                var
                    MAX_ZOOMS = 4,
                    zoomings = [];
                return function zoomHandlerClosure(factor){
                    var
                        zoom,
                        clientX,
                        circles,
                        zoomedData,
                        minRangeNum,
                        maxRangeNum,
                        minRangeDate,
                        maxRangeDate,
                        isZoomIn = factor > 0;

                    if (isZoomIn && zoomings.length > MAX_ZOOMS){
                        return;
                    }
                    if (!isZoomIn && zoomings.length === 0){
                        return;
                    }
                    zoomedData = [];
                    clientX = d3.event.clientX;
                    zoom = isZoomIn ? 250 : 750;
                    minRangeDate = xScale.invert(clientX - zoom);
                    maxRangeDate = xScale.invert(clientX + zoom);
                    minRangeNum = (+minRangeDate);
                    maxRangeNum = (+maxRangeDate);
                    
                    // Updates the dataset
                    if (isZoomIn){
                        data.forEach(function forEachFn(d){
                            var mills = (+d.date);
                            if (mills >= minRangeNum && mills <= maxRangeNum){
                                zoomedData.push({
                                    date: new Date(d.date)
                                });
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
                        (function zoomOutFn(){
                            // Updates zommings removing last one
                            var popZoom = zoomings.pop();
                            xScale.domain(popZoom.domain);
                            zoomedData = popZoom.data;
                        }());
                    }
                    
                    // Applies the zoomed data set and gets reference to circles
                    circles = svg.selectAll('circle').data(zoomedData, keyFn);
                    
                    // Updates the position of the circles in rage
                    circles.transition().duration(500).attr('cx', cxFn);

                    if (isZoomIn){
                        // Removes the circles out of new range
                        circles.exit().remove();
                    }
                    else {
                        // Adds back missing circles on zooming out
                        appendCircles(function selectionFn(){
                            return circles.enter();
                        });
                    }

                    // Updates the axis
                    svg.select('.axis').call(xAxis);
                };
            }()),

            svg = vis.append('svg')
                .attr('width', '100%')
                .attr('height', 100),
            indicatorDate,
            indicatorLine;

        svg.append('line')
            .attr('x1', xScale(d3.min(data, dateAccessor)))
            .attr('y1', '50')
            .attr('x2', xScale(d3.max(data, dateAccessor)))
            .attr('y2', '50')
            .attr('stroke', '#000')
            .attr('stroke-width', '1');
        // Adds vertical line following mouse cursor
        indicatorLine = svg.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', visHeight)
            .attr('stroke', '#000')
            .attr('stroke-width', '1');
        
        indicatorDate = svg.append('text');
        // Handles movement of indicator line
        svg.on('mousemove', function(){
            var clientX = d3.event.clientX - 10,
                mouseSpot = xScale.invert(clientX),
                dSpot = 0,
                dataMatches = function dataMatches(){
                    var
                        rayGap = CIRCLE_RAY / 2,
                        min = clientX - rayGap,
                        max = clientX + rayGap;
                    return data.some(function someFn(d){
                        var dRange = xScale(d.date);
                        if (dRange <= max && dRange >= min){
                            dSpot = dRange;
                            return true;
                        }
                    });
                };
            indicatorLine.attr('transform', 'translate(' + clientX + ', 0)');
            // Shows the date corresponding to the current bullet
            /*if (dataMatches()){
                indicatorDate
                    .attr('opacity', 1)
                    .attr('transform', 'translate(' + clientX + ',' + 20 + ')')
                    .text(xScale.invert(dSpot));
                svg.selectAll("circle")
                    .filter(function filterFn(d){
                        return xScale(d.date) === dSpot;
                    })
                    .attr('fill', CIRCLE_SELECTED_FILL)
                    .attr('r', CIRCLE_SELECTED_RAY);
            }
            else {
                svg.selectAll("circle")
                    .filter(function filterFn(){
                        var el = d3.select(this),
                            isMaster = function isMaster(){
                                return el.datum(function datumFn(d){
                                        return !d.master;
                                    });
                            },
                            isHighlighted = function isHighlighted(){
                                return el.attr('r') === CIRCLE_SELECTED_RAY;
                            };
                        return !isMaster() && isHighlighted();
                    })
                    .attr('fill', CIRCLE_FILL)
                    .attr('r', CIRCLE_RAY);

                // Hides the date tooltip
                indicatorDate.attr('opacity', 0);
            }*/
        });
        
        appendCircles(function selectionFn(){
            return svg.selectAll('circle')
                .data(data, keyFn)
                .enter();
        });
        
        svg.append('g')
            .attr('class', 'axis')
            .call(xAxis)
            .attr('transform', 'translate(0,' + 78 + ')');

        // Implement resize handlers to update static parts
        window.addEventListener('resize', function resizeListener(event){
            if (event.stopPropagation){
                event.stopPropagation();
            }
            // Updates the visualization width reference
            visWidth = vis.node().offsetWidth;
            
            xScale.range([MARGINS, visWidth - MARGINS]);
            svg.select('.axis')
                .call(xAxis);
        });

        // Attaches event for handling zoom in and out
        svg.on('wheel', function(){
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
                var result = (typeof assertion === 'function' ?
                        assertion.apply(context, args) : {check: assertion});
                console.log(
                    result.check ? 'Pass.' : '## Fail! ' +
                        (typeof message === 'function' ?
                            message(result) : message)
                );
            };

        test(
            void(0) === xToDate(),
            'Passing undefined should return undefined'
        );

        // Tests the xToDate
        (function firstLastScaleTest(){
            var
                firstDate = new Date('01/01/2014'),
                lastDate = new Date('01/02/2014'),
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
                    return 'expected 01/01/2014 but was: ' + result.value;
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
                    return 'expected 01/02/2014 but was: ' + result.value;
                }
            );
        }());

    }());
};