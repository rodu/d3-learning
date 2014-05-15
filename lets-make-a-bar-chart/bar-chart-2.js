/* global: d3 */
window.onload = function onLoad(){
    var
        width = 400,
        barHeight = 20,
        MAX = 400,
        data = d3.range(10, MAX, 20),
        scaleX = d3.scale.linear()
                    .domain([0, MAX])
                    .range([0, MAX]),
        chart = d3.select('.chart')
            .attr('width', width)
            .attr('height', barHeight * data.length),
        bar = chart.selectAll('g')
            .data(data)
            .enter().append('g')
                .attr('transform', function transform(d, i){
                    return 'translate(0,' + (i * barHeight) + ')';
                });
    
    bar.append('rect')
        .attr('width', scaleX)
        .attr('height', barHeight - 1);

    bar.append('text')
        .attr('x', function barX(d){
            return scaleX(d) - 3;
        })
        .attr('y', barHeight / 2)
        .attr('dy', '0.35em')
        .text(function barText(d){
            return d;
        });
};