"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { IdentityMapData } from "@/lib/types";

interface IdentityMapProps {
  data: IdentityMapData;
}

const ZONE_CONFIG = {
  your_ground: { label: "Your Ground", color: "#00d492" },
  growing_edge: { label: "Growing Edge", color: "#c44d5a" },
  ai_zone: { label: "AI Zone", color: "#8a6565" },
} as const;

interface TreeNode {
  name: string;
  confidence?: number;
  evidence?: string;
  color: string;
  children?: TreeNode[];
}

export function IdentityMap({ data }: IdentityMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;

    // Build tree data
    const treeData: TreeNode = {
      name: "YOU",
      color: "#00d492",
      children: [
        {
          name: ZONE_CONFIG.your_ground.label,
          color: ZONE_CONFIG.your_ground.color,
          children: data.your_ground.map((s) => ({
            name: s.skill,
            confidence: s.confidence,
            evidence: s.evidence,
            color: ZONE_CONFIG.your_ground.color,
          })),
        },
        {
          name: ZONE_CONFIG.growing_edge.label,
          color: ZONE_CONFIG.growing_edge.color,
          children: data.growing_edge.map((s) => ({
            name: s.skill,
            confidence: s.confidence,
            evidence: s.evidence,
            color: ZONE_CONFIG.growing_edge.color,
          })),
        },
        {
          name: ZONE_CONFIG.ai_zone.label,
          color: ZONE_CONFIG.ai_zone.color,
          children: data.ai_zone.map((s) => ({
            name: s.skill,
            confidence: s.confidence,
            evidence: s.evidence,
            color: ZONE_CONFIG.ai_zone.color,
          })),
        },
      ],
    };

    // Count total leaf nodes to determine height
    const totalLeaves = data.your_ground.length + data.growing_edge.length + data.ai_zone.length;
    const rowHeight = 38;
    const height = Math.max(400, totalLeaves * rowHeight + 80);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const margin = { top: 30, right: 200, bottom: 30, left: 80 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create hierarchy
    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree<TreeNode>().size([innerH, innerW]);
    treeLayout(root);

    // Curved links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", (d) => (d.target.data as TreeNode).color)
      .attr("stroke-opacity", 0)
      .attr("stroke-width", 1.2)
      .attr("d", d3.linkHorizontal<d3.HierarchyLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
        .x((d) => d.y ?? 0)
        .y((d) => d.x ?? 0) as unknown as (d: d3.HierarchyLink<TreeNode>) => string
      )
      .transition()
      .duration(600)
      .delay((_, i) => i * 50)
      .attr("stroke-opacity", 0.3);

    // Nodes
    const node = g
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.y},${d.x})`);

    // Root node (YOU)
    node
      .filter((d) => d.depth === 0)
      .append("circle")
      .attr("r", 20)
      .attr("fill", "#18141e")
      .attr("stroke", "#00d492")
      .attr("stroke-width", 2);

    node
      .filter((d) => d.depth === 0)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 5)
      .attr("fill", "#00d492")
      .attr("font-size", "12px")
      .attr("font-weight", "700")
      .text("YOU");

    // Zone nodes (depth 1)
    node
      .filter((d) => d.depth === 1)
      .append("circle")
      .attr("r", 14)
      .attr("fill", (d) => (d.data as TreeNode).color)
      .attr("fill-opacity", 0.15)
      .attr("stroke", (d) => (d.data as TreeNode).color)
      .attr("stroke-width", 1.5);

    node
      .filter((d) => d.depth === 1)
      .append("text")
      .attr("dy", -22)
      .attr("text-anchor", "middle")
      .attr("fill", (d) => (d.data as TreeNode).color)
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .text((d) => (d.data as TreeNode).name);

    // Skill leaf nodes (depth 2)
    const leaves = node.filter((d) => d.depth === 2);

    // Confidence circle
    leaves
      .append("circle")
      .attr("r", 0)
      .attr("fill", (d) => (d.data as TreeNode).color)
      .attr("fill-opacity", 0.2)
      .attr("stroke", (d) => (d.data as TreeNode).color)
      .attr("stroke-width", 1)
      .transition()
      .duration(400)
      .delay((_, i) => 300 + i * 60)
      .attr("r", 8);

    // Inner dot sized by confidence
    leaves
      .append("circle")
      .attr("r", 0)
      .attr("fill", (d) => (d.data as TreeNode).color)
      .attr("fill-opacity", 0.7)
      .transition()
      .duration(400)
      .delay((_, i) => 300 + i * 60)
      .attr("r", (d) => 2 + ((d.data as TreeNode).confidence ?? 0) * 5);

    // Skill name — right of node
    leaves
      .append("text")
      .attr("x", 16)
      .attr("dy", 4)
      .attr("fill", "#f0ecf4")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("fill-opacity", 0)
      .text((d) => (d.data as TreeNode).name)
      .transition()
      .duration(300)
      .delay((_, i) => 400 + i * 60)
      .attr("fill-opacity", 0.85);

    // Confidence % — after skill name
    leaves
      .append("text")
      .attr("x", 16)
      .attr("dy", 18)
      .attr("fill", (d) => (d.data as TreeNode).color)
      .attr("font-size", "10px")
      .attr("font-weight", "400")
      .attr("fill-opacity", 0)
      .text((d) => `${Math.round(((d.data as TreeNode).confidence ?? 0) * 100)}% confidence`)
      .transition()
      .duration(300)
      .delay((_, i) => 500 + i * 60)
      .attr("fill-opacity", 0.5);

    // Hover: show evidence tooltip
    const tooltip = svg
      .append("g")
      .style("pointer-events", "none")
      .style("opacity", 0);

    const tooltipRect = tooltip
      .append("rect")
      .attr("rx", 6)
      .attr("fill", "#18141e")
      .attr("stroke", "#2e2838")
      .attr("stroke-width", 1);

    const tooltipTextGroup = tooltip.append("text")
      .attr("fill", "#f0ecf4")
      .attr("font-size", "11px");

    leaves
      .on("mouseenter", function (_event, d) {
        const data = d.data as TreeNode;
        if (!data.evidence) return;

        d3.select(this).select("circle").transition().duration(150).attr("r", 12);

        tooltipTextGroup.selectAll("tspan").remove();
        const words = data.evidence.split(" ");
        let line = "";
        let lineCount = 0;

        words.forEach((word) => {
          const test = line ? `${line} ${word}` : word;
          if (test.length > 45 && line) {
            tooltipTextGroup
              .append("tspan")
              .attr("x", 10)
              .attr("dy", lineCount === 0 ? 16 : 14)
              .text(line);
            line = word;
            lineCount++;
          } else {
            line = test;
          }
        });
        if (line) {
          tooltipTextGroup
            .append("tspan")
            .attr("x", 10)
            .attr("dy", lineCount === 0 ? 16 : 14)
            .text(line);
          lineCount++;
        }

        const boxW = 300;
        const boxH = lineCount * 14 + 18;
        tooltipRect.attr("width", boxW).attr("height", boxH);

        const tx = (d.y ?? 0) + margin.left + 20;
        const ty = (d.x ?? 0) + margin.top - boxH / 2;
        tooltip.attr("transform", `translate(${tx}, ${ty})`);
        tooltip.transition().duration(150).style("opacity", 1);
      })
      .on("mouseleave", function () {
        d3.select(this).select("circle").transition().duration(150).attr("r", 8);
        tooltip.transition().duration(150).style("opacity", 0);
      });
  }, [data]);

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg ref={svgRef} />
    </div>
  );
}
