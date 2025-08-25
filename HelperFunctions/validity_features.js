const f1 = "https://static.sdcampus.com/assets/batch_validity_features/master_validity_inside.png"
const f2 = "https://static.sdcampus.com/assets/batch_validity_features/more_validity_inside.png"
const f3 = "https://static.sdcampus.com/assets/batch_validity_features/new_batch_validity_included.png"
const f4 = "https://static.sdcampus.com/assets/batch_validity_features/premium_feature_included.png"


// school-> sainik/jnv eng -> https://static.sdcampus.com/assets/batch_validity_features/premium_feature_included.png
// school-> sainik/jnv hi -> https://static.sdcampus.com/assets/batch_validity_features/more_validity_inside.png //
// general paid batch -> https://static.sdcampus.com/assets/batch_validity_features/new_batch_validity_included.png
// free batch
const batchValidityFeatures = (category) => {
    switch (category) {
        case "School Entrance Exams":
            return "https://static.sdcampus.com/assets/batch_validity_features/more_validity_inside.png";
        case "UGC NET Exams":
            return "https://static.sdcampus.com/assets/batch_validity_features/master_validity_inside.png";
        default:
            return "";
    }
    // if (category === "School Entrance Exams") {
    //     if (subCategory === "SAINIK SCHOOL") {
    //         return "https://static.sdcampus.com/assets/batch_validity_features/more_validity_inside.png";
    //     } else if (subCategory === "JNV SCHOOL") {
    //         return "https://static.sdcampus.com/assets/batch_validity_features/new_batch_validity_included.png";
    //     } else {
    //         return "https://static.sdcampus.com/assets/batch_validity_features/more_validity_inside.png";
    //     }
    // }

    // if (category === "UGC NET Exams") {
    //     if (subCategory === "ENGLISH") {
    //         return "https://static.sdcampus.com/assets/batch_validity_features/more_validity_inside.png";
    //     } else if (subCategory === "HINDI") {
    //         return "https://static.sdcampus.com/assets/batch_validity_features/premium_feature_included.png";
    //     } else {
    //         return "https://static.sdcampus.com/assets/batch_validity_features/more_validity_inside.png";
    //     }
    // }

    // // Final fallback for all unmatched categories/subcategories
    // return "https://static.sdcampus.com/assets/batch_validity_features/more_validity_inside.png";
};


module.exports = {
    batchValidityFeatures
};