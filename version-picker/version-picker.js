/* global: d3 */
window.onload = function onLoad(){
    'use strict';
    var
        CANVAS_WIDTH = '100%',
        CANVAS_HEIGHT = 120,
        RANGE_MIN = new Date('01/01/2004'),
        RANGE_MAX = new Date('12/31/2014'),
        MARGINS = 10,
        CIRCLE_RAY = 5,
        CIRCLE_SELECTED_RAY = 10,
        CIRCLE_FILL = '#D6C9C9',
        CIRCLE_MASTER_FILL = '#CF5151',
        CIRCLE_SELECTED_FILL = '#EDECB2',
        MAX_ZOOM_LEVELS = 5,
        elMaster,
        elCompared,
        elCompareTooltip,
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
            var cy = CANVAS_HEIGHT / 2;
            selectionFn().append('circle')
                .attr('cx', cxFn)
                .attr('cy', cy)
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
            .attr('width', CANVAS_WIDTH)
            .attr('height', CANVAS_HEIGHT),
        indicatorDate,
        indicatorLine;
    // Adds horizontal line in middle of visualization
    svg.append('line')
        .attr('x1', xScale(d3.min(data, dateAccessor)))
        .attr('y1', CANVAS_HEIGHT / 2)
        .attr('x2', xScale(d3.max(data, dateAccessor)))
        .attr('y2', CANVAS_HEIGHT / 2)
        .attr('stroke', '#000')
        .attr('stroke-width', '1');
    // Adds vertical line following mouse cursor
    indicatorLine = svg.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', CANVAS_HEIGHT)
        .attr('stroke', '#000')
        .attr('stroke-width', '1');
    
    indicatorDate = svg.append('text').attr('class', 'indicator-date');
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
                        .text(dSpot.date)
                        .attr('fill', '#A47878')
                        .attr('transform', function transformFn(){
                            var GAP = 10,
                                textWidth = this.getComputedTextLength(),
                                x = clientX < visWidth - textWidth - GAP ?
                                clientX + GAP : clientX - textWidth - GAP;
                            return 'translate(' + x + ',' + 20 + ')';
                        });
                    
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
                            .attr('y',
                                (+elSpot.attr('cy')) + (+elSpot.attr('r')) + 5)
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
    
    // Adds axis with relative marks
    svg.append('g')
        .attr('class', 'axis')
        .call(xAxis)
        .attr('transform', 'translate(0,' + (CANVAS_HEIGHT - 20) + ')');

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
};