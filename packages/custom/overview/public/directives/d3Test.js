/*global d3, $, svgPanZoom:false */
'use strict';

var app = angular.module('mean.overview');

app.directive('displayGraph', ['TasklistService', 'User', '$q', function (TasklistService, User, $q) {

    // The amount to move down y for each level of depth
    var levelDepth = 100,
        deferred = $q.defer();

    /**
    * Allow click events to be triggered programmatically
     *
     * This needs to be updated to remove initMouseEvent
    */
    $.fn.d3Click = function () {
        this.each(function (i, e) {
            var evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

            e.dispatchEvent(evt);
        });
    };
    /**
     * Reworking of original tree graph creation
     *
     * Zooming and panning: http://stackoverflow.com/questions/17405638/d3-js-zooming-and-panning-a-collapsible-tree-diagram
     * Zoomable, panable, scalable tree: http://bl.ocks.org/robschmuecker/7880033
     *
     * Critical Path Method: https://github.com/MilanPecov/critical-path-method
     * .NET CPM: http://www.leniel.net/2007/12/critical-path-method.html#sthash.MFd5MpNB.dpbs
     * Python implementation: https://github.com/dhenderson/criticalpy
     * JS implementation, not sure if it's any good: https://github.com/maxinfang/Cpath
     */
    var updatedTree = function () {
        var heightWidthModifierObj = {
            h1: 20,
            h2: 120,
            w1: 20,
            w2: 120
        };
        // Determine width based on modifier
        var height = 1280,
            // Determine height based on modifier
            width = $('#task_graph').width(),
            i = 0,
            root;

        // Create SVG element, append g, translate from top left (120, 20)
        var graph = d3.select('#task_graph')
        .append('svg:svg')
        .attr('width', width)
        .attr('height', height)
        .append('svg:g')
        .attr('transform', 'translate(' + 0 + ',' + heightWidthModifierObj.h1 + ')');

        // Tree
        var tree = d3.layout.tree().size([width, height]);
        // Projections based on data points
        var diagonal = d3.svg.diagonal().projection(function (d) {
            return [d.x, d.y];
        });
        d3.json('/tasks/team/graph/' + User.getIdentity().teams[0], function (json) {
            root = json;
            //root.x0 = width / 2;
            root.x0 = 0;
            root.y0 = 0;
            createNodes(root);
            // Reposition nodes based on estimate
            repositionNodes();
        });

        /**
         * Get the original coordinates a node to be repositioned
         * @param originalTransform
         * @returns {Array}
         */
        var getOriginalCoordinates = function (originalTransform) {
            var subT = originalTransform.substr(originalTransform.indexOf('(') + 1);
            var coordinatesOnly = subT.substr(0, subT.indexOf(')'));
            return coordinatesOnly.split(',');
        };

        /**
         * Reposition nodes based on time estimates
         */
        var repositionNodes = function () {
            // Variables for moving the nodes themselves
            var gParent, originalTransform, coordinatesSplit, newYCoordinate, currentEstimate;
            // Variables for moving the paths
            var extendLength, pathD, pathDSplit, pathLastDrawInstruction, pathXCoordinate, pathYCoordinate,
                sourceStartY, targetStartY, sourceEndY, targetEndY, amountToTranslateY;

            /**
             * Reposition individual nodes based on estimate or based on parent's estimate
             * @param d
             * @param nodeDomElement
             */
            var repositionIndividualNode = function (d, nodeDomElement) {
                // Don't mess with the top level node
                if (typeof d.parent === 'undefined') {
                    return;
                }
                // Get the grouping parent, which has the transform property
                gParent = $(nodeDomElement).parent().get(0);
                // Get the original transform property of the node
                originalTransform = gParent.getAttribute('transform');
                // Get the coordinates of the original transform property
                coordinatesSplit = getOriginalCoordinates(originalTransform);
                // Determine the amount to move based on estimate (default estimate of 1)
                currentEstimate = parseInt(d.estimate) * levelDepth || levelDepth;
                // Determine the new y value, based on parent y + estimate of current node
                newYCoordinate = parseInt(parseInt(d.parent.y) + (currentEstimate));
                // Move the node to its new position
                gParent.setAttribute('transform', 'translate(' + coordinatesSplit[0] + ',' + newYCoordinate + ')');
                // Modify the y value on the data of the current node
                d.y = newYCoordinate;
            };

            var closedHashTable = [];

            /**
             * Redraw paths when nodes are repositioned
             * @param d
             * @param thisPath
             *
             * Follow the same idea above -- Create paths based on the parent node, not every single matching node
             */
            var redrawPathsBasedOnReposition = function (d, thisPath) {
                // Get children of the closed item, so we can know not to create lines for them
                if (!d.source.children && d.source._children) {
                    closedHashTable.push(d.source.id);
                    closedHashTable.push(d.target.id);
                    return;
                }
                // If the path about to be created is for a closed node, return
                if (closedHashTable.indexOf(d.source.id) !== -1) {
                    closedHashTable.push(d.target.id);
                    return;
                }
                // The y that the source and target nodes were at before moving
                sourceStartY = d.source.depth * levelDepth;
                targetStartY = d.target.depth * levelDepth;
                // The actual current y value of the source and target node
                sourceEndY = d.source.y;
                targetEndY = d.target.y;
                // The amount to translate the path based on source movement
                amountToTranslateY = 0;
                // If the depth of the source node is changed (source y != (source depth * level depth)
                if (sourceEndY !== sourceStartY) {
                    // Determine the amount to translate y, based on source current and starting y
                    amountToTranslateY = sourceEndY - sourceStartY;
                    $(thisPath).attr('transform', 'translate(0, ' + amountToTranslateY + ')');
                }
                // If the depth of the target node is changed, extend the path to it
                if (targetEndY !== targetStartY) {
                    extendLength = (targetEndY - targetStartY) - amountToTranslateY;
                    // Get original svg path d attribute
                    pathD = thisPath.getAttribute('d');
                    // Split coordinates
                    pathDSplit = pathD.split(' ');
                    // Split the last coordinate instructions, so we can get coordinates to extend from
                    pathLastDrawInstruction = pathDSplit[pathDSplit.length -1].split(',');
                    // Get original x and y
                    pathXCoordinate = pathLastDrawInstruction[0];
                    pathYCoordinate = pathLastDrawInstruction[1];
                    // Keep x the same, extend y as far down as necessary
                    thisPath.setAttribute('d', pathD + ' L' + pathXCoordinate + ',' + (parseInt(pathYCoordinate) + extendLength));
                }
            };

            // @todo Not sure why, but I need to set a timeout or the lines never finish drawing.
            // It seems as though this if this runs before everything is drawn initially, it interrupts the drawing
            // This might be a clue: http://stackoverflow.com/questions/10692100/invoke-a-callback-at-the-end-of-a-transition
            // @todo NOTE: These functions did not turn out to need to be recursive, since d3 correctly traverses for me
            setTimeout(function () {
                d3.selectAll('circle').transition().each('end', function (d) {
                    repositionIndividualNode(d, this);
                });
                // Lengthen the path when necessary
                d3.selectAll('path').transition().each('end', function (d) {
                    redrawPathsBasedOnReposition(d, this);
                });
                deferred.resolve();
            }, 500);
        };

        /**
         * Toggle and update on click
         */
        var clickInProgress = false,
            opening = null;
        var toggleClick = function (nodeEnter) {
            nodeEnter.on('click', function (d) {
                // If no children, don't do anything
                if (!d.children && !d._children) {
                    return;
                }
                toggle(d);
                createNodes(d);
                clickInProgress = false;
                opening = null;
            });
        };

        /**
         * Append text to each node
         */
        var appendText = function (nodeEnter) {
            nodeEnter.append('svg:text').attr('x', function (d) {
                // On first iteration
                return d.children || d._children ? -10 : 10;
            })
            .attr('dy', '.35em')
                // If there are children, anchor text at end. Otherwise, at start
            .attr('text-anchor', function (d) {
                return (d.children || d._children) ? 'end' : 'start';
                // Place the name as the text on each node
            }).text(function (d) {
                return d.title;
                // 1e-6 is a workaround for text flicker when transitioning text
            }).style('fill-opacity', 1e-6);
        };

        //var cloneAndConsole = function (node) {
        //    console.log(_.clone(node));
        //};

        var depthModifierByEstimate = 1;

        /**
         * Update data, draw nodes, etc
         */
        var createNodes = function (source) {
            var duration = 500;

            /**
             * This will automatically make the nodes stretch as far x as possible, and close to as far y as possible
             */
            var nodes = tree.nodes(root);

            /**
             * Determine x position based on how far down the hierarchy the node resides (0-ordered)
             */
            nodes.forEach(function (d) {
                depthModifierByEstimate = 1;
                d.y = d.depth * levelDepth;
                if (d.estimate && d.estimate > 1) {
                    depthModifierByEstimate = d.estimate;
                }
            });

            /**
             * Assign each node an id, or else return the id already assigned
             */
            var node = graph.selectAll('g.node').data(nodes, function (d) {
                if (d.id) {
                    return d.id;
                }
                d.id = i;
                i = i + 1;
                return d.id;
            });

            /**
            * Append each node on top of the parent node for their stating position
            */
            var nodeEnter = node.enter().append('svg:g').attr('class', 'node').attr('transform', function (d) {
                var originalClass = $(this).attr('class');
                // Add the title of the node to the class
                var newClass = originalClass + ' ' + d.title;
                // Note nodes which will be repositioned
                if (d.parent && d.parent.estimate && d.parent.estimate > 1) {
                    newClass = newClass + ' reposition';
                }
                // Set the new class
                $(this).attr('class', newClass);
                return 'translate(0,0)';
            });

            /**
            * Append children for each that has them, then style them
            */
            nodeEnter.append('svg:circle').attr('r', 1e-6).style('fill', function (d) {
                return d._children ? 'lightsteelblue' : '#fff';
            });

            /**
            * Move the nodes to their proper locations
            */
            var nodeUpdate = node.transition().duration(duration).attr('transform', function (d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });

            /**
            * Define how big the circles are, and then color them based on whether children exist
            */
            nodeUpdate.select('circle').attr('r', 4.5).style('fill', function (d) {
                return d._children ? 'lightsteelblue' : '#fff';
            });

            /**
            * When removing nodes, move them back to the parents position, fade out circle and text
            */
            var nodeExit = node.exit().transition().duration(duration).attr('transform', function (d) {
                return 'translate(' + source.x + ',' + source.y + ')';
            }).remove();
            nodeExit.select('circle').attr('r', 1e-6);
            nodeExit.select('text').style('fill-opacity', 1e-6);

            /**
            * Stash the old positions for transition.
            */
            nodes.forEach(function (d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });


            /**
            * Draw the lines
            */
            var link = graph.selectAll('path.link').data(tree.links(nodes), function (d) {
                return d.target.id;
            });

            // Enter any new links at the parent's previous position.
            link.enter().insert('svg:path', 'g').attr('class', 'link').attr('d', function (d) {
                // Add ID for the path for finding during repositioning
                $(this).attr('id', d.source.title + '_' + d.target.title);
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            }).transition().duration(duration).attr('d', diagonal);

            // Transition links to their new position.
            link.transition().duration(duration).attr('d', diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit().transition().duration(duration).attr('d', function (d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            }).remove();

            /**
            * Append and fill text
            */
            appendText(nodeEnter);
            nodeUpdate.select('text').style('fill-opacity', 1);

            // Toggle each node on click
            toggleClick(nodeEnter);
        };

        // Toggle children.
        function toggle(d) {
            // Remove children nodes that exist
            if (d.children) {
                d._children = d.children;
                d.children = null;
                // Add children nodes back in
            } else {
                d.children = d._children;
                d._children = null;
            }
            repositionNodes();
        }
        return deferred.promise;
    };

    return {
        restrict: 'A',
        templateUrl: 'overview/views/directiveTemplates/d3_test.html',
        scope: {
            data: '='
        },
        link: function (scope, element, attrs) {
            updatedTree().then(function () {
                // Init pan, zoom
                svgPanZoom('#task_graph svg', {
                    fit: false,
                    center: false,
                    dblClickZoomEnabled: false
                });
            });
        }
    };
}]);