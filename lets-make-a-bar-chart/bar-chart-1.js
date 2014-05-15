/* global: d3 */
window.onload = function onLoad(){
    var data = d3.range(10, 400, 20);
    d3.select('.chart')
        .selectAll('div')
        .data(data)
        .enter().append('div')
        .style('height', 20 + 'px')
        .style('width', function width(d){
            var rnd1 = Math.random() * (5 - 2) + 2;
                rnd2 = Math.random() * (7 - 1) + 1;
            return Math.min(d * rnd1 / rnd2, 750) + 'px';
        })
        .text(function text(d){
            return d;
        });
};