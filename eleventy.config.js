export default function (eleventyConfig) {

	// Passthrough
	eleventyConfig.addPassthroughCopy({ "src/assets": "." });

	// Filters
	eleventyConfig.addFilter("timeToRead", (content) => {
		const getPlainText = (html) => {
			const htmlTags = String.raw`<\\/?[ a-z0-9]+\\b[^>]*>`;
			const htmlComments = String.raw`<!--[ ^]*?-->`;
			return html.replace(new RegExp(String.raw`${htmlTags}|${htmlComments}`, "gi"), "");
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