import embedEverything from "eleventy-plugin-embed-everything";

export default function (eleventyConfig) {

	// Passthrough
	eleventyConfig.addPassthroughCopy({ "src/assets": "." });

	// Filters
	eleventyConfig.addFilter("timeToRead", (content) => {
		const getPlainText = (html) => {
			html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
			html = html.replace(/<!--[\s\S]*?-->/g, "");
			html = html.replace(/<\/?[a-z0-9]+\b[^>]*>/gi, "");
			return html;
		};

		const rawText = getPlainText(content);
		const wpm = 240;
		const words = rawText.trim().split(/\s+/).length;
		const time = Math.ceil(words / wpm);

		return time;
	});
	eleventyConfig.addFilter("postDate", (date) => {
		return new Date(date).toLocaleDateString("nl-NL", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	});
	// Filter to get initials from a name
	eleventyConfig.addFilter("getInitials", function (name) {
		return name
			.split(' ')
			.map(word => word.charAt(0).toUpperCase())
			.join('')
			.slice(0, 2); // Limit to 2 initials
	});

	// Plugins
	eleventyConfig.addPlugin(embedEverything, {
		youtube: {
			options: {
				embedClass: 'aspect-square',
			},
		},
	});


	return {
		markdownTemplateEngine: "njk",
		dir: {
			input: "src/pages",
			output: "public",
			includes: "../includes",
			layouts: "../layouts",
			data: "../data",
		},
	};
};