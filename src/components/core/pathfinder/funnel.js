// Pathfinder.js

const funnel = (start, end, portals) => {

  if(portals.length === 0){
    return [start, end];
  }

  const path = [];

  let apex = start;
  let left = start;
  let right = start;

  let apexIndex = 0;
  let leftIndex = 0;
  let rightIndex = 0;

  path.push(apex);

  for(let i=0; i<portals.length; i++) {
    const portalLeft = portals[i].left;
    const portalRight = portals[i].right;

    // tighten right side
    if(this.triangleArea(apex, right, portalRight) <= 0) {
        if(apex === right || this.triangleArea(apex, left, portalRight) > 0){
            right = portalRight;
            rightIndex=i;
        }
        else {
            path.push(left);
            apex = left;
            apexIndex = leftIndex;

            left = apex;
            right = apex;

            leftIndex = apexIndex;
            rightIndex = apexIndex;

            i = apexIndex;
            continue;
        }
    }

    // tighten left side
    if(this.triangleArea(apex, left, portalLeft) >= 0) {
      if(apex === left || this.triangleArea(apex, right, portalLeft) < 0) {
        left = portalLeft;
        leftIndex=i;
      }
      else {
        path.push(right);
        apex = right;
        apexIndex = rightIndex;
        left = apex;
        right = apex;
        leftIndex = apexIndex;
        rightIndex = apexIndex;

        i = apexIndex;
        continue;
      }
    }
  }

  path.push(end);
  return path;
}


const triangleArea = (a, b, c) => {
  return (
    (b.x-a.x)*(c.z-a.z) -
    (b.z-a.z)*(c.x-a.x)
  );
}