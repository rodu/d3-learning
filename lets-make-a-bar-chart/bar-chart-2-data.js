/* global: d3 */
window.onload = function onLoad(){
    var
        MAX = 400,
        DATA_PROP = "virt",
        width = MAX,
        barHeight = 20,
        scaleX = d3.scale.linear()
                    .range([0, MAX]),
        chart = d3.select('.chart')
            .attr('width', width),
        type = function type(d){
            d[DATA_PROP] = +d[DATA_PROP];
            return d;
        };

    d3.tsv('top.tsv', type, function tsv(error, data){
        var
            bar;
        scaleX.domain([0, d3.max(data, function dataFn(d){
            return d[DATA_PROP];
        })]);
        chart.attr('height', barHeight * data.length);

        bar = chart.selectAll('g')
        .data(data)
        .enter().append('g')
            .attr('transform', function transform(d, i){
                return 'translate(0,' + (i * barHeight) + ')';
            });
    
        bar.append('rect')
            .attr('width', function width(d){
                return scaleX(d[DATA_PROP]);
            })
            .attr('height', barHeight - 1);

        bar.append('text')
            .attr('x', function barX(d){
                return scaleX(d[DATA_PROP]) - 3;
            })
            .attr('y', barHeight / 2)
            .attr('dy', '0.35em')
            .text(function barText(d){
                return d.command;
            });
    });
};