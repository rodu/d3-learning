/* global: d3 */
window.onload = function onLoad(){
    var
        DATA_PROP = "virt",
        margin = {top: 20, right: 20, bottom: 130, left: 80},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        barHeight = 20,
        x = d3.scale.ordinal()
            .rangeRoundBands([0, width], 0.1),
        y = d3.scale.linear()
            .range([height, 0]),
        xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom'),
        yAxis = d3.svg.axis()
            .scale(y)
            .orient('left'),
        chart = d3.select('.chart')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')'),
        type = function type(d){
            d[DATA_PROP] = +d[DATA_PROP];
            return d;
        };

    d3.tsv('top.tsv', type, function tsv(error, data){
        var
            barWidth,
            bar;
        data = data.filter(function filter(d){
            return d[DATA_PROP] > 0;
        });
        barWidth = width / data.length;

        x.domain(data.map(function dataMap(d){
            return d.command;
        }));
        y.domain([0, d3.max(data, function dataFn(d){
            return d[DATA_PROP];
        })]);

        chart.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis)
            .selectAll('text')
                .attr('y', 0)
                .attr('x', -110)
                .attr('dy', '0.35em')
                .attr('transform', 'rotate(-90)')
                .style('text-anchor', 'start');

        chart.append('g')
            .attr('class', 'y axis')
            .call(yAxis)
            .append('text')
                .attr('transform', 'rotate(-90)')
                /*.attr('x', -(height - 20))*/
                .attr('y', 6)
                .attr('dy', '0.71em')
                .style('text-anchor', 'end')
                .text('Load');

        chart.selectAll('.bar')
            .data(data)
            .enter().append('rect')
                .attr('class', 'bar')
                .attr('x', function xFn(d){
                    return x(d.command);
                })
                .attr('y', function yFn(d){
                    return y(d[DATA_PROP]);
                })
                .attr('height', function heightFn(d){
                    return height - y(d[DATA_PROP]);
                })
                .attr('width', x.rangeBand());


        /*bar = chart.selectAll('g')
        .data(data)
        .enter().append('g')
            .attr('transform', function transform(d){
                return 'translate(' + x(d.command) + ',0)';
            });
    
        bar.append('rect')
            .attr('y', function yFn(d){
                return y(d[DATA_PROP]);
            })
            .attr('height', function heightFn(d){
                return height - y(d[DATA_PROP]);
            })
            .attr('width', x.rangeBand());

        bar.append('text')
            .attr('x', x.rangeBand() / 2)
            /*.attr('y', function yFn(d){
                return y(d[DATA_PROP]) + 10;
            })
            .attr('y', height + 0)
            .attr('transform', 'rotate(45)')
            .text(function barText(d){
                return d.command;
            });
        */
    });
};