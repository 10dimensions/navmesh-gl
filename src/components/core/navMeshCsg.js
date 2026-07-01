import * as BABYLON from "babylonjs";
import { CreateNavigationPluginAsync } from "@babylonjs/addons";
import * as RecastCore from "@recast-navigation/core";
import * as RecastGenerators from "@recast-navigation/generators";

export class NavMesh {
    constructor() {
        this.navMeshState = {
            cs: 0.2,
            ch: 0.2,
            walkableSlopeAngle: 45,
            walkableHeight: 1.0,
            walkableClimb: 0.5,
            walkableRadius: 0.4,
            maxEdgeLen: 12,
            maxSimplificationError: 1.3,
            minRegionArea: 8,
            mergeRegionArea: 20,
            maxVertsPerPoly: 6,
            detailSampleDist: 6,
            detailSampleMaxError: 1
        };

        this.navigationPlugin = null;
        this.debugMesh = null;
    }

    getNavMeshState() {
        return this.navMeshState;
    }

    async init(scene) {
        await RecastCore.init();
        this.navigationPlugin =
            await CreateNavigationPluginAsync({
                instance: {
                    ...RecastCore,
                    ...RecastGenerators
                }
            });

        this.navigationPlugin.setDefaultQueryExtent(new BABYLON.Vector3(2, 4, 2));

        return new BABYLON.TransformNode("navMeshGroup", scene);
    }

    rebuildNavMesh = (scene, navMeshGroupRef, stateRef) => {
        if (!this.navigationPlugin) return;

        this.clearNavMesh(navMeshGroupRef);

        /*
            Use the actual Babylon geometry.
            Ground + obstacles are passed to Recast.
            No CSG subtraction.
        */

        const meshes = scene.meshes.filter(mesh => {
                return (
                    mesh.isEnabled() &&
                    mesh.isVisible &&
                    mesh.getTotalVertices() > 0 &&
                    mesh !== this.debugMesh

                );
            });

        this.navigationPlugin.createNavMesh(
            meshes,
            {
                ...this.navMeshState,
                ...stateRef.current.navParams
            }
        );

        this.debugMesh = this.navigationPlugin.createDebugNavMesh(scene);

        const mat = new BABYLON.StandardMaterial("navDebugMaterial", scene);
        mat.diffuseColor = new BABYLON.Color3(0.06, 0.84, 0.65);
        mat.alpha = 0.35;
        mat.emissiveColor = new BABYLON.Color3(0, 0.2, 0.15);

        this.debugMesh.material = mat;
        this.debugMesh.position.y =0.02;
        this.debugMesh.parent = navMeshGroupRef.current;
    };

    findPath(start, end) {
        if (!this.navigationPlugin) return [];
        return this.navigationPlugin.computePath(start, end);
    }

    findSmoothPath(start, end) {
        if (!this.navigationPlugin) return [];
        return this.navigationPlugin.computePathSmooth(start, end);
    }

    getClosestPoint(position) {
        return this.navigationPlugin?.getClosestPoint(position)??position;
    }

    moveAlong(position, destination) {
        return this.navigationPlugin?.moveAlong(position, destination)??position;
    }

    addObstacle(mesh) {
        if (!this.navigationPlugin) return null;

        const box = mesh.getBoundingInfo().boundingBox;

        return this.navigationPlugin
            .addBoxObstacle(
                mesh.position,
                box.extendSize.scale(2),
                mesh.rotation.y
            );
    }

    clearNavMesh(navMeshGroupRef) {
        if (this.debugMesh) {
            this.debugMesh.dispose();
            this.debugMesh = null;
        }

        if (navMeshGroupRef.current && navMeshGroupRef.current.getChildMeshes) {
            debugger
            navMeshGroupRef.current.getChildMeshes().forEach(mesh =>mesh.dispose());
        }
    }

    dispose() {
        if (this.navigationPlugin) {
            this.navigationPlugin.dispose();
            this.navigationPlugin = null;
        }
    }
}
