/**
 * 这个文件主要是初始化操作，完成初始化后就不太需要这个文件了
 * Author：Frank.Wu
 * Date:2019-05-28
 * Version 1.0
 */

 //当前展示的文件路径
currentViewerFilePath='';


/**
 * Cesium 初始化
 * @param {ima} imgurl 
 */
function CesiumInitial(imgurl)
{
    window.cesiumViewer = new Cesium.Viewer('cesiumContainer', {
		useDefaultRenderLoop: false,
		animation: false,
		baseLayerPicker : false,
		fullscreenButton: false, 
		geocoder: false,
		homeButton: false,
		infoBox: false,
		sceneModePicker: false,
		selectionIndicator: false,
		timeline: false,
		navigationHelpButton: false,
		imageryProvider : new Cesium.ArcGisMapServerImageryProvider({url:imgurl}),
        terrainShadows: Cesium.ShadowMode.DISABLED,
/*         terrainProvider:new Cesium.CesiumTerrainProvider({
            url : 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles', // 默认立体地表
            requestVertexNormals: true,
            requestWaterMask: true
        }), */
    });
}


/**
 * load potree las file
 * @param {加载文件路径} path 
 */
function LoadLASDataViewer(path,projec_def)
{
    currentViewerFilePath = path;
    //定义的投影带为50度带
    // 不添加cesium库单独通过potree进行数据展示
    // let pointcloudProjection = projec_def;
    // let mapProjection = proj4.defs("EPSG:4326");
    // window.toMap = proj4(pointcloudProjection, mapProjection);
    // window.toScene = proj4(mapProjection, pointcloudProjection);
    Potree.loadPointCloud(path, "data1", e => {
        let pointcloud = e.pointcloud;
        pointcloud.projection = projec_def;     //affect the overview
        let material = pointcloud.material;
        viewer.scene.addPointCloud(pointcloud);
        material.pointColorType = Potree.PointColorType.RGB; // any Potree.PointColorType.XXXX 
        material.pointSizeType  = Potree.PointSizeType.ADAPTIVE;
        viewer.fitToScreen();
        // //定义的投影带为50度带
        // let pointcloudProjection = projec_def;
		// let mapProjection = proj4.defs("EPSG:4326");
        // Potree.measureTimings = true;
		// window.toMap = proj4(pointcloudProjection, mapProjection);
		// window.toScene = proj4(mapProjection, pointcloudProjection);
		// {
		// 	let bb = viewer.getBoundingBox();
		// 	let minWGS84 = proj4(pointcloudProjection, mapProjection, bb.min.toArray());
        //     let maxWGS84 = proj4(pointcloudProjection, mapProjection, bb.max.toArray());
            
        //     if(typeof cesiumViewer != "undefined")
        //     {
        //         let cp = new Cesium.Cartesian3.fromDegrees((minWGS84[0]+maxWGS84[0])/2, (minWGS84[1]+maxWGS84[1])/2, 500.0);
        //         cesiumViewer.camera.setView({
        //             destination : cp,
        //             orientation: {
        //                 heading : 0.0, 
        //                 pitch : 90.0, 
        //                 roll : 0.0 
        //             }
        //         });
        //         viewer.scene.view.position.set((bb.min.x+bb.max.x)/2,(bb.min.y+bb.max.y)/2,(bb.min.z+bb.max.z)/2+500);
		//         viewer.scene.view.lookAt(new THREE.Vector3((bb.min.x+bb.max.x)/2,(bb.min.y+bb.max.y)/2,0.0));
        //     }
		// }
    });
}

/**
 * initial las file scene
 * @param {las file path} path 
 */
function InitialScene()
{
    window.viewer=null;
    if( typeof cesiumViewer != "undefined")
    {
	    viewer = new Potree.Viewer(document.getElementById("potree_render_area"),{
            useDefaultRenderLoop:false
        });	
    }else{
        viewer = new Potree.Viewer(document.getElementById("potree_render_area"));	
    }

	viewer.setEDLEnabled(true);
	viewer.setFOV(60);
	viewer.setPointBudget(1000*1000);
	viewer.setMinNodeSize(0);
	viewer.loadSettingsFromURL();
	viewer.setBackground('skybox');
	viewer.loadGUI(() => {
        viewer.setLanguage('en');
        $("#menu_appearance").next().show();
        //viewer.toggleSidebar();
    });
}

/**
 * 更新cesium展示
 * @param {} timestamp 
 */
function loop(timestamp){
    requestAnimationFrame(loop);
    viewer.update(viewer.clock.getDelta(), timestamp);
    viewer.render();

    if(window.toMap !== undefined){
        {
            let camera = viewer.scene.getActiveCamera();

            let pPos		= new THREE.Vector3(0, 0, 0).applyMatrix4(camera.matrixWorld);
            let pRight  = new THREE.Vector3(600, 0, 0).applyMatrix4(camera.matrixWorld);
            let pUp		 = new THREE.Vector3(0, 600, 0).applyMatrix4(camera.matrixWorld);
            let pTarget = viewer.scene.view.getPivot();

            let toCes = (pos) => {
                let xy = [pos.x, pos.y];
                let height = pos.z;
                let deg = toMap.forward(xy);
                let cPos = Cesium.Cartesian3.fromDegrees(...deg, height);

                return cPos;
            };

            let cPos = toCes(pPos);
            let cUpTarget = toCes(pUp);
            let cTarget = toCes(pTarget);

            let cDir = Cesium.Cartesian3.subtract(cTarget, cPos, new Cesium.Cartesian3());
            let cUp = Cesium.Cartesian3.subtract(cUpTarget, cPos, new Cesium.Cartesian3());

            cDir = Cesium.Cartesian3.normalize(cDir, new Cesium.Cartesian3());
            cUp = Cesium.Cartesian3.normalize(cUp, new Cesium.Cartesian3());

            cesiumViewer.camera.setView({
                destination : cPos,
                orientation : {
                    direction : cDir,
                    up : cUp
                }
            });
            
        }

        let aspect = viewer.scene.getActiveCamera().aspect;
        if(aspect < 1){
            let fovy = Math.PI * (viewer.scene.getActiveCamera().fov / 180);
            cesiumViewer.camera.frustum.fov = fovy;
        }else{
            let fovy = Math.PI * (viewer.scene.getActiveCamera().fov / 180);
            let fovx = Math.atan(Math.tan(0.5 * fovy) * aspect) * 2
            cesiumViewer.camera.frustum.fov = fovx;
        }
        
    }

    cesiumViewer.render();
}

/**
 * initial the scene
 */
function Initial()
{
    var path = "pointclouds/data/cloud.js";
    // 不添加cesium库单独通过potree进行数据展示
    //CesiumInitial('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer');
    InitialScene();
    LoadLASDataViewer(path,"+proj=utm +zone=50 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");
    // 不添加cesium库单独通过potree进行数据展示
    //requestAnimationFrame(loop);
}