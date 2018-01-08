var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var WorkItemSchema = Schema({
	name: { type: String, unique: true },
	description: String,
	unit: String,
	unitPrice: Number,
	subWorkItems: [
		{
			workItemId: { type: Schema.Types.ObjectId, ref: 'WorkItemSchema' },
			quantity: Number
		}
	]
});

var _db = {
	WorkItem: mongoose.model('WorkItem', WorkItemSchema)
};

module.exports = _db;
