/* global: d3 */
window.onload = function onLoad(){
    var exports;
    function versionPicker(){
        var
            RANGE_MIN = new Date('01/01/2004'),
            RANGE_MAX = new Date('12/31/2014'),
            elMaster,
            elCompared,
            elCompareTooltip,
            MARGINS = 10,
            CIRCLE_RAY = 5,
            CIRCLE_SELECTED_RAY = 10,
            CIRCLE_FILL = '#D6C9C9',
            CIRCLE_MASTER_FILL = '#CF5151',
            CIRCLE_SELECTED_FILL = '#EDECB2',
            MAX_ZOOM_LEVELS = 5,
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

            /* Receives a value representing the coordinate on the X, and maps
            that to a Date corresponding to the visualization xScale.
             */
            xToDate = function xToDate(xScale, x){
                if (typeof xScale === 'function'){
                    return xScale.invert(x);
                }
            },

            keyFn = function keyFn(d){
                return d ? +d.date : void(0);
            },

            cxFn = function cxFn(d){
                return ((xScale(d.date) / visWidth) * 100) + '%';
            },

            appendCircles = function appendCircles(selectionFn){
                selectionFn().append('circle')
                    .attr('cx', cxFn)
                    .attr('cy', 50)
                    .attr('r', function rFn(d){
                        return d.isMaster || d.isCompared ?
                            CIRCLE_SELECTED_RAY : CIRCLE_RAY;
                    })
                    .attr('fill', function fillFn(d){
                        return d.isMaster ? CIRCLE_MASTER_FILL :
                            d.isCompared ? CIRCLE_SELECTED_FILL : CIRCLE_FILL;
                    })
                    .attr('stroke', '#980606')
                    .attr('data-selected', 'false')
                    .on('click', function clickFn(d){
                        var el = d3.select(this);
                        // Reset previously selected elMaster
                        if (elMaster){
                            elMaster.datum(function datumFn(d){
                                return d.isMaster = false, d;
                            })
                            .attr('r', CIRCLE_RAY)
                            .attr('fill', CIRCLE_FILL);
                        }
                        // Sets the properties for this circle to be the
                        // elMaster
                        el.datum(function datumFn(d){
                            return d.isMaster = true, d;
                        })
                        .attr('r', CIRCLE_SELECTED_RAY)
                        .attr('fill', CIRCLE_MASTER_FILL);

                        // Stores reference to current elMaster
                        elMaster = d3.select(this);
                        if (elCompared){
                            elCompared.datum(function datumFn(d){
                                return d.isCompared = void(0), d;
                            })
                            .attr('r', CIRCLE_RAY)
                            .attr('fill', CIRCLE_FILL);
                        }
                        if (elCompareTooltip){
                            elCompareTooltip.remove();
                        }
                        elCompared = elCompareTooltip = void(0);
                    });
            },

            zoomHandler = (function zoomHandler(){
                var
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

                    if (isZoomIn && zoomings.length >= MAX_ZOOM_LEVELS){
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
        (function mouseMovement(){
            var
                lastDSpot = 0,
                isTooltipShown = false;
            svg.on('mousemove', function(){
                var clientX = d3.event.clientX - 10,
                    mouseSpot = xScale.invert(clientX),
                    dSpot,
                    elSpot,
                    dataMatches = function dataMatches(){
                        var
                            rayGap = CIRCLE_RAY / 2,
                            min = clientX - rayGap,
                            max = clientX + rayGap;
                        return data.some(function someFn(d){
                            var dRange = xScale(d.date);
                            if (dRange <= max && dRange >= min){
                                dSpot = d;
                                return true;
                            }
                        });
                    };
                indicatorLine.attr('transform',
                    'translate(' + clientX + ', 0)');
                // Shows the date corresponding to the current bullet
                if (dataMatches()){
                    if (keyFn(dSpot) !== keyFn(lastDSpot)){
                        lastDSpot = dSpot;
                        // Shows the date of the current spot the mouse is over
                        indicatorDate.attr('opacity', 1)
                            .attr('transform',
                                'translate(' + clientX + ',' + 20 + ')')
                            .text(dSpot.date);
                        
                        elSpot = svg.selectAll('circle')
                            .filter(function filterFn(d){
                                return xScale(d.date) === xScale(dSpot.date);
                            })
                            .datum(function datumFn(d){
                                return d.isHighlighted = true, d;
                            })
                            .attr('fill', function fillFn(d){
                                return d.isMaster ?
                                    CIRCLE_MASTER_FILL : CIRCLE_SELECTED_FILL;
                            })
                            .attr('r', CIRCLE_SELECTED_RAY);
                        
                        // Shows the compare flag on items to be compared
                        if (elMaster && !dSpot.isMaster && !dSpot.isCompared){
                            elCompareTooltip = svg.append('rect')
                                .attr('class', 'compare-rect')
                                .attr('x', xScale(dSpot.date) - 20)
                                .attr('y', 65)
                                .attr('width', 40)
                                .attr('height', 20)
                                .attr('fill', '#DFD6D6')
                                .on('click', function(){
                                    if (elCompared){ // resets previous compared
                                        elCompared.attr('r', CIRCLE_RAY)
                                            .attr('fill', CIRCLE_FILL)
                                            .datum(function datumFn(d){
                                                return d.isCompared = void(0),
                                                    d;
                                            });
                                    }
                                    (elCompared = elSpot).datum(
                                        function datumFn(d){
                                            return d.isCompared = true, d;
                                        })
                                        .attr('fill', CIRCLE_SELECTED_FILL)
                                        .attr('r', CIRCLE_SELECTED_RAY);
                                    console.log(
                                        'compares',
                                        elMaster.datum(),
                                        'with',
                                        elSpot.datum()
                                    );
                                });
                        }
                        isTooltipShown = true;
                    }
                }
                else {
                    if (isTooltipShown){
                        svg.selectAll('circle')
                            .filter(function filterFn(d){
                                return d.isHighlighted &&
                                    !d.isMaster && !d.isCompared;
                            })
                            .datum(function datumFn(d){
                                return d.isHighlighted = false, d;
                            })
                            .attr('fill', CIRCLE_FILL)
                            .attr('r', CIRCLE_RAY);
                        
                        svg.selectAll('rect.compare-rect').remove();
                        // Hides the date tooltip
                        indicatorDate.attr('opacity', 0);
                        isTooltipShown = false;
                        lastDSpot = 0;
                    }
                }
            });
        }());
        
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