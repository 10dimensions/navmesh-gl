import * as BABYLON from "babylonjs";
import Recast from "recast-detour";

export class NavMesh {

    constructor() {
        this.navMeshState = {
            cs: 0.2,
            ch: 0.2,
            walkableSlopeAngle: 45,
            walkableHeight: 1.0,
            walkableClimb: 0.5,
            walkableRadius: 0.4
        };

        this.navigationPlugin = null;
        this.debugMesh = null;
    }

    getNavMeshState() {
        return this.navMeshState
    }

    async init(scene) {

        const recast = await Recast();

        this.navigationPlugin =
            new BABYLON.RecastJSPlugin(recast);

        return new BABYLON.TransformNode(
            "navMeshGroup",
            scene
        );
    }

    rebuildNavMesh = (scene, navMeshGroupRef, stateRef) => {

        if (!this.navigationPlugin) return;

        this.clearNavMesh(navMeshGroupRef);

        //------------------------------------
        // collect meshes
        //------------------------------------

        const meshes = [];

        scene.meshes.forEach(mesh => {
            if (
                mesh.isEnabled() &&
                mesh.isVisible &&
                mesh !== this.debugMesh &&
                mesh.name !== "navMeshDebug"
            ) {
                meshes.push(mesh);
            }
        });

        //------------------------------------
        // build navmesh
        //------------------------------------

        this.navigationPlugin.createNavMesh(
            meshes,
            {
                cs: stateRef.current.navParams.cs,
                ch: stateRef.current.navParams.ch,
                walkableSlopeAngle:
                    stateRef.current.navParams.walkableSlopeAngle,
                walkableHeight:
                    stateRef.current.navParams.walkableHeight,
                walkableClimb:
                    stateRef.current.navParams.walkableClimb,
                walkableRadius:
                    stateRef.current.navParams.walkableRadius,

                maxEdgeLen: 12,
                maxSimplificationError: 1.3,
                minRegionArea: 8,
                mergeRegionArea: 20,
                maxVertsPerPoly: 6,
                detailSampleDist: 6,
                detailSampleMaxError: 1
            }
        );

        //------------------------------------
        // create debug mesh
        //------------------------------------

        this.debugMesh = this.navigationPlugin.createDebugNavMesh(scene);

        const mat = new BABYLON.StandardMaterial("navmeshMaterial", scene);

        mat.diffuseColor = new BABYLON.Color3(0.06, 0.84, 0.65);
        mat.alpha = 0.35;
        mat.emissiveColor = new BABYLON.Color3(0, 0.2, 0.15);

        this.debugMesh.material = mat;
        this.debugMesh.parent = navMeshGroupRef.current;
    };

    clearNavMesh = (navMeshGroupRef) => {

        if (this.debugMesh) {
            this.debugMesh.dispose();
            this.debugMesh = null;
        }

        if (navMeshGroupRef.current) {
            navMeshGroupRef.current
                .getChildMeshes()
                .forEach(m => m.dispose());
        }
    };

    findPath(start, end) {
        if (!this.navigationPlugin) return [];

        return this.navigationPlugin.computePath(start, end);
    }

    getClosestPoint(position) {
        if (!this.navigationPlugin) return position;

        return this.navigationPlugin.getClosestPoint(
            position
        );
    }

    moveAlong(position, destination) {
        if (!this.navigationPlugin) return destination;

        return this.navigationPlugin.moveAlong(
            position,
            destination
        );
    }

}