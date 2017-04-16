$(function () {

    $('#search').click(function () {

        var query = {
            keyword: $('#keyword').val(),
            method: 'getMovieList'
        };
        movieSearch(query);

    });

    var createKeyword = function (csvFile,response) {

        d3.csv(csvFile,
            function (data) {
                $("#analytics-area").append(
                    "<div class='x_title'>"
                    + "<h1>コメント出現可視化</h1>"
                    + "<div class='clearfix'></div>"
                    + "</div>");
                d3.select("#analytics-area").append("svg");
                data = response['analysisKeywordList'];
                console.log(data);
                var data = Object.keys(data).map(function (key) {return data[key]});


                var h = 800;
                var w = 1000;
                data = data.splice(0, 1200); //処理wordを1200件に絞る

                var random = d3.random.irwinHall(2)

                var countMax = d3.max(data, function (d) {
                    return d.count
                });
                var sizeScale = d3.scale.linear().domain([0, countMax]).range([10, 100])
                var colorScale = d3.scale.category20();

                var words = data.map(function (d) {
                    return {
                        text: d.word,
                        size: sizeScale(d.count) //頻出カウントを文字サイズに反映
                    };
                });

                d3.layout.cloud().size([w, h])
                    .words(words)
                    .rotate(function () {
                        return Math.round(1 - random()) * 90;
                    }) //ランダムに文字を90度回転
                    .font("Impact")
                    .fontSize(function (d) {
                        return d.size;
                    })
                    .on("end", draw) //描画関数の読み込み
                    .start();

                //wordcloud 描画
                function draw(words) {
                    d3.select("svg")
                        .attr({
                            "width": w,
                            "height": h
                        })
                        .append("g")
                        .attr("transform", "translate(500,400)")
                        .selectAll("text")
                        .data(words)
                        .enter()
                        .append("text")
                        .style({
                            "font-family": "Impact",
                            "font-size": function (d) {
                                return d.size + "px";
                            },
                            "fill": function (d, i) {
                                return colorScale(i);
                            }
                        })
                        .attr({
                            "text-anchor": "middle",
                            "transform": function (d) {
                                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                            }
                        })
                        .text(function (d) {
                            return d.text;
                        });
                }

            });
    }

    var movieSearch = function (query) {

        $.ajax({
                url: 'http://localhost:8888/googleSearch/production/php/api.php',
                type: 'post', // getかpostを指定(デフォルトは前者)
                dataType: 'json', // 「json」を指定するとresponseがJSONとしてパースされたオブジェクトになる
                data: { // 送信データを指定(getの場合は自動的にurlの後ろにクエリとして付加される)
                    query: query
                }
            })
            // ・ステータスコードは正常で、dataTypeで定義したようにパース出来たとき
            .done(function (response) {
                console.log(response);
                $('#chart').empty();
                $('#comment-area').empty();
                $('#search-area').empty();
                $("#analytics-area").empty();


                // テンプレートを定義
                var compiled = _.template(
                    "<div class='row tile_count'><div class='col-md-2 col-sm-4 col-xs-6 tile_stats_count'> <span class='count_top'><i class='fa fa-user'></i> Total Count</span> "
                    + "<div class='count'><%= response.totalCount %></div>"
                    + "<span class='count_bottom'> </div> <div class='col-md-2 col-sm-4 col-xs-6 tile_stats_count'>"
                    + "<span class='count_top'><i class='fa fa-clock-o'></i> perPage</span> "
                    + "<div class='count'><%= response.perPage %></div>"
                    + "<span class='count_bottom'></div>"
                    + "<div class='clearfix'></div>"
                    + "<% _.each(response.movieList, function(video) { %>"
                    + "<% if(!_.isEmpty(video.thumbnails)){ %>"
                    + "<div class='col-md-4 col-sm-4 col-xs-12'>"
                    + "<div class='x_panel tile fixed_height_350 overflow_hidden'>"
                    + "<div class='x_title'>"
                    + "<h5><%= video.title %> </h5>"
                    + "<div class='clearfix'></div>"
                    + "</div>"
                    + "<a href='https://www.youtube.com/watch?v='"+'<%= video.videoId %>'+">"
                    + "<img src='" + "<%= video.thumbnails.medium.url %>" + "'>"
                    + "</a>"
                    + "<p><%= video.description %> </p>"
                    + "<input type='hidden' id='videoId' value='"+'<%= video.videoId %>'+"'>"
                    + "<button type='button' class='btn btn-success getComment'value='"+'<%= video.videoId %>'+"'>分析する</button>"
                    + "</div>"
                    + "</div>"
                    + "<% } %>"
                    + "<% }); %>"
                );

                $("#search-area").html(compiled({response: response}));

                $('.getComment').click(function (data) {
                    getComment($(data.currentTarget).val());

                });

            })
            // ・サーバからステータスコード400以上が返ってきたとき
            // ・ステータスコードは正常だが、dataTypeで定義したようにパース出来なかったとき
            // ・通信に失敗したとき
            .fail(function (response) {
                console.log(response);
            });
    }

    var getComment = function(videoId) {

        d3.tsv(videoId,
            function(error, data) {

                console.log(videoId);
                var query = {
                    videoId:videoId,
                    method:'getComment'
                };

                // Ajax通信を開始する
                $.ajax({
                        url: 'http://ec2-52-88-160-219.us-west-2.compute.amazonaws.com/shashoku_collection_restaurant/shashoku_collection_restaurant/production/php/api.php',
                        type: 'post', // getかpostを指定(デフォルトは前者)
                        dataType: 'json', // 「json」を指定するとresponseがJSONとしてパースされたオブジェクトになる
                        data: { // 送信データを指定(getの場合は自動的にurlの後ろにクエリとして付加される)
                            query: query
                        }
                    })
                    // ・ステータスコードは正常で、dataTypeで定義したようにパース出来たとき
                    .done(function (response) {
                        console.log(response);

                        //$('#chart').empty();
                        $('#comment-area').empty();
                        $('#search-area').empty();

                        // テンプレートを定義
                        var compiled = _.template(
                            "<h1><%= response.title %></h1>"
                            +"<div class='animated flipInY col-lg-3 col-md-3 col-sm-6 col-xs-12'>"
                            +"<div class='tile-stats'>"
                            + "<% if(!_.isEmpty(response.thumbnails)){ %>"
                            + "<img src='" + "<%= response.thumbnails.medium.url %>" + "'>"
                            + "<% } %>"
                            +"</div>"
                            +"</div>"
                            +"<div class='animated flipInY col-lg-3 col-md-3 col-sm-6 col-xs-12'>"
                            +"<div class='tile-stats'>"
                            +"<div class='icon'><i class='fa fa-check-square-o'></i></div>"
                            +"<div class='count'>110</div>"
                            +"<h3>Favarit Count</h3>"
                            +"<p>Lorem ipsum psdea itgum rixt.</p>"
                            +"</div>"
                            +"</div>"
                            +"<div class='animated flipInY col-lg-3 col-md-3 col-sm-6 col-xs-12'>"
                            +"<div class='tile-stats'>"
                            +"<div class='icon'><i class='fa fa-caret-square-o-right'></i></div>"
                            +"<div class='count'>74,745</div>"
                            +"<h3>Play Count</h3>"
                            +"<p>Lorem ipsum psdea itgum rixt.</p>"
                            +"</div>"
                            +"</div>"
                            + "<div class='clearfix'></div>"
                            + "<p><%= response.description %></p>"
                            + "<table id='datatable' class='table table-striped table-bordered dataTable no-footer'>"
                            + "<thead>"
                            + "<tr role='row'>"
                            + "<th>投稿者</th><th>コメント</th><th>投稿時間</th><th>イイネ数</th>"
                            + "</tr>"
                            + "</thead>"
                            + "<% _.each(response.commentList, function(comment) { %>"
                            + "<tr>"
                            + " <td><%= comment.authorDisplayName %> </td>"
                            + " <td><%= comment.textDisplay %> </td>"
                            + " <td><%= comment.date %> </td>"
                            + " <td><%= comment.likeCount %> </td>"
                            + "</tr>"
                            + "<% }); %>"
                            +"<table>"
                        );
                        $("#comment-area").html(compiled({response: response}));

                        createKeyword('test.csv',response);
                        heatChart(response);

                        //return response;
                    })
                    // ・サーバからステータスコード400以上が返ってきたとき
                    // ・ステータスコードは正常だが、dataTypeで定義したようにパース出来なかったとき
                    // ・通信に失敗したとき
                    .fail(function (response) {
                        alert('コメントがありません。');
                    });


            });
    };

    var heatChart = function(response) {

        $("#chart").append(
            "<div class='x_title'>"
            + "<h1>コメント時間帯別投稿時間</h1>"
            + "<div class='clearfix'></div>"
            + "</div>");
        var margin = {top: 50, right: 0, bottom: 100, left: 30},
            width = 960 - margin.left - margin.right,
            height = 440 - margin.top - margin.bottom,
            gridSize = Math.floor(width / 24),
            legendElementWidth = gridSize * 2,
            buckets = 9,
            colors = ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"], // alternatively colorbrewer.YlGnBu[9]
            days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
            times = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"];
        datasets = ["data.tsv", "data2.tsv"];

        var svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var dayLabels = svg.selectAll(".dayLabel")
            .data(days)
            .enter().append("text")
            .text(function (d) {
                return d;
            })
            .attr("x", 0)
            .attr("y", function (d, i) {
                return i * gridSize;
            })
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
            .attr("class", function (d, i) {
                return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis");
            });

        var timeLabels = svg.selectAll(".timeLabel")
            .data(times)
            .enter().append("text")
            .text(function (d) {
                return d;
            })
            .attr("x", function (d, i) {
                return i * gridSize;
            })
            .attr("y", 0)
            .style("text-anchor", "middle")
            .attr("transform", "translate(" + gridSize / 2 + ", -6)")
            .attr("class", function (d, i) {
                return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis");
            });

        var data = response['commentDateTimeList'];
        console.log(data);
        var colorScale = d3.scale.quantile()
            .domain([0, buckets - 1, d3.max(data, function (d) { return d.value; })])
            .range(colors);

        var cards = svg.selectAll(".hour")
            .data(data, function(d) {return d.day+':'+d.hour;});

        cards.append("title");

        cards.enter().append("rect")
            .attr("x", function(d) { return (d.hour - 1) * gridSize; })
            .attr("y", function(d) { console.log(d.day); return (d.day - 1) * gridSize; })
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("class", "hour bordered")
            .attr("width", gridSize)
            .attr("height", gridSize)
            .style("fill", colors[0]);

        cards.transition().duration(1000)
            .style("fill", function(d) { return colorScale(d.value); });

        cards.select("title").text(function(d) { return d.value; });

        cards.exit().remove();

        var legend = svg.selectAll(".legend")
            .data([0].concat(colorScale.quantiles()), function(d) { return d; });

        legend.enter().append("g")
            .attr("class", "legend");

        legend.append("rect")
            .attr("x", function(d, i) { return legendElementWidth * i; })
            .attr("y", height)
            .attr("width", legendElementWidth)
            .attr("height", gridSize / 2)
            .style("fill", function(d, i) { return colors[i]; });

        legend.append("text")
            .attr("class", "mono")
            .text(function(d) { return "≥ " + Math.round(d); })
            .attr("x", function(d, i) { return legendElementWidth * i; })
            .attr("y", height + gridSize);

        legend.exit().remove();
    }
});