(async () => {
    // import dom
    const drawme = document.getElementById("drawme");
    const deleteMe = document.getElementById("drawme-delete");

    // css style func
    function addStyle(element, ...rest) {
        for (let [key, value] of Object.entries(rest[0])) {
            if (element != null) element.style[key] = value;
        }
    }
    // set map cursor
    function setMapCursor(type) {
        map.getCanvas().style.cursor = `${type}`;
    }

    let data = [];
    let allMarkers = [];

    try {
        const res = await fetch("./schools-list.geojson");
        data = await res.json();
    } catch (error) {
        console.log(error);
    }

    const map = new mapboxgl.Map({
        accessToken: "YOUR_ACCESS_TOKEN",
        container: "map",
        style: "mapbox://styles/mapbox/streets-v11",
        center: [-1.77704, 53.69316],
        zoom: 5,
    });

    map.on("load", () => {
        // add map marker
        data.features.forEach((d, index) => {
            const htmlMarker = document.createElement("div");
            htmlMarker.classList.add("map-marker");

            const newmarker = new mapboxgl.Marker(htmlMarker)
                .setLngLat(d.geometry.coordinates)
                .addTo(map);
            allMarkers.push(newmarker);

            let mouseHover = null;
            // add mouse hover
            htmlMarker.onmouseover = function () {
                mouseHover = new mapboxgl.Popup()
                    .setLngLat(d.geometry.coordinates)
                    .setHTML(`<h3>${d.properties.Establishment}</h3>`)
                    .addTo(map);
                htmlMarker.style.backgroundImage = `url('./assets/mappindefault-white.svg')`;
            };
            // add mouse out event
            htmlMarker.onmouseout = function () {
                mouseHover.remove();
                htmlMarker.style.backgroundImage = `url('./assets/mappindefault.svg')`;
            };
        });

        //fit bound
        const bounds = new mapboxgl.LngLatBounds(
            data.features[0].geometry.coordinates,
            data.features[0].geometry.coordinates
        );

        for (const d of data.features) {
            bounds.extend(d.geometry.coordinates);
        }

        map.fitBounds(bounds, {
            padding: 100,
        });

        // feature
        const f = {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [],
            },
            properties: {
                id: 2,
                duration: 3.04455,
            },
        };

        //
        map.addLayer({
            id: "route-content-1",
            type: "line",
            source: {
                type: "geojson",
                data: {
                    type: "FeatureCollection",
                    features: [f],
                },
                generateId: true,
            },
            paint: {
                "line-color": "#74b300",
                "line-width": 2,
            },
        });

        map.addLayer({
            id: "route-content-2",
            type: "fill",
            source: "route-content-1",
            layout: {},
            paint: {
                "fill-color": "#74b300",
                "fill-opacity": 0.3,
                "fill-outline-color": "#74b300",
            },
        });

        // acitve button
        deleteMe.style.display = "flex";
        drawme.style.display = "flex";
    });

    let isEnableDrawme = false;
    let isMouseDown = false;
    let currentCntPoly = -1;
    const allDrawPoly = [];
    let allMarker = [];

    //data format
    let drawPoly = {
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: [[]],
        },
    };

    //MOUSE MOVE EVENT
    map.on("mousemove", function (e) {
        lngX = e.lngLat.lng;
        latY = e.lngLat.lat;
        let coord = [e.lngLat.lng, e.lngLat.lat];
        if (isMouseDown && isEnableDrawme) {
            if (
                allDrawPoly[currentCntPoly].geometry.coordinates[0].length === 0
            ) {
                allDrawPoly[currentCntPoly].geometry.coordinates[0].push(coord);
                allDrawPoly[currentCntPoly].geometry.coordinates[0].push(coord);
            } else {
                allDrawPoly[currentCntPoly].geometry.coordinates[0].splice(
                    allDrawPoly[currentCntPoly].geometry.coordinates[0].length -
                        1,
                    0,
                    coord
                );
            }
            // draw in map
            if (map.getSource("route-content-1")) {
                map.getSource("route-content-1").setData({
                    type: "FeatureCollection",
                    features: allDrawPoly,
                });
            }
        }
    });

    // mouse down event
    map.on("mousedown", function (e) {
        if (!isEnableDrawme) {
            setMapCursor(`grabbing`);
            return;
        }
        isMouseDown = true;
        allDrawPoly.push(drawPoly);
        currentCntPoly++;
    });

    let mouseHover = null;
    map.on("mouseup", async function (e) {
        if (!isEnableDrawme) return;

        // disable draw me
        isEnableDrawme = false;
        isMouseDown = false;
        drawme.style.background = "orange";

        // map properties
        map.dragPan.enable();
        setMapCursor(`pointer`);

        drawPoly = {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [[]],
            },
        };

        // save and previous polygon draw in map
        if (map.getSource("route-content-1")) {
            map.getSource("route-content-1").setData({
                type: "FeatureCollection",
                features: allDrawPoly,
            });
        }

        // find data inside and set marker
        data.features.forEach((d, index) => {
            const div = document.createElement("div");
            addStyle(div, {
                height: "35px",
                width: "25px",
                cursor: "pointer",
                backgroundImage: `url('./assets/mappindefault.svg')`,
                backgroundPosition: `center`,
            });

            // add mouse hover
            div.onmouseover = function () {
                mouseHover = new mapboxgl.Popup()
                    .setLngLat(d.geometry.coordinates)
                    .setHTML(`<h3>${d.properties.Establishment}</h3>`)
                    .addTo(map);
                div.style.backgroundImage = `url('./assets/mappindefault-white.svg')`;
            };
            // add mouse out event
            div.onmouseout = function () {
                mouseHover.remove();
                div.style.backgroundImage = `url('./assets/mappindefault.svg')`;
            };

            allDrawPoly.forEach((poly, i) => {
                var isInside1 = turf.inside(d, poly);
                if (isInside1) {
                    const newMarker = new mapboxgl.Marker(div)
                        .setLngLat(d.geometry.coordinates)
                        .addTo(map);
                    allMarker.push(newMarker);
                }
            });
        });
    });

    // drawme click event
    drawme.addEventListener("click", function () {
        allMarkers.forEach((marker) => marker.remove());
        allMarkers = [];

        isEnableDrawme = !isEnableDrawme;
        if (isEnableDrawme) {
            setMapCursor(`url('./assets/draw.svg') 0 18, move`);
            map.dragPan.disable();
            // change color of button
            drawme.style.background = "red";
        } else {
            // map section
            setMapCursor(`grab`);
            map.dragPan.enable();
            drawme.style.background = "orange";
        }
    });

    // remove all polygon draw
    deleteMe.addEventListener("click", function () {
        if (allDrawPoly.length === 0) return;

        // remove all allDrawPoly
        allDrawPoly.splice(0, allDrawPoly.length);
        // remove all marker
        allMarker.forEach((marker) => marker.remove());
        allMarker = [];

        // reset current cnt poly
        currentCntPoly = -1;

        // save and previous polygon draw in map
        if (map.getSource("route-content-1")) {
            map.getSource("route-content-1").setData({
                type: "FeatureCollection",
                features: allDrawPoly,
            });
        }
    });
})();
