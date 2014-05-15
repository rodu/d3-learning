/* global: d3 */
window.onload = function onLoad(){
    var
        MAX = 400,
        data = d3.range(10, MAX, 20),
        scaleX = d3.scale.linear()
                    .domain([0, MAX])
                    .range([0, MAX]);
    d3.select('.chart')
        .selectAll('div')
        .data(data)
        .enter().append('div')
        .style('height', 20 + 'px')
        .style('width', function width(d){
            var rnd1 = Math.random() * (5 - 2) + 2;
                rnd2 = Math.random() * (7 - 3) + 3;
            return scaleX(d * rnd1 / rnd2) + 'px';
        })
        .text(function text(d){
            return d;
        });
};