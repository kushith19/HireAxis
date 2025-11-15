from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
import PyPDF2
import docx2txt
import os
from rapidfuzz import fuzz, process

# --- Global Initialization ---
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # allow requests from all origins (safe for dev)

# --- Load spaCy model once (faster, avoids reloading every request) ---
try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    print("⚠️ spaCy model not found. Run: python -m spacy download en_core_web_sm")
    raise e

# --- Skills List ---
SKILLS = [
    # Programming Languages
    "Python", "Java", "C", "C++", "C#", "Go", "Rust", "Kotlin", "Swift", "PHP", "JavaScript", "TypeScript", "R", "Ruby", "MATLAB", "Perl",

    # Web Development
    "HTML", "CSS", "JavaScript", "TypeScript", "React", "Angular", "Vue.js", "Next.js", "Nuxt.js",
    "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "Laravel", "ASP.NET",

    # Databases
    "SQL", "MySQL", "PostgreSQL", "SQLite", "MongoDB", "Redis", "Cassandra", "Elasticsearch", "Firebase",

    # Cloud & DevOps
    "AWS", "Azure", "Google Cloud", "GCP", "Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible", "Git", "GitHub", "GitLab", "CI/CD",

    # Data Science / ML / AI
    "Machine Learning", "Deep Learning", "Artificial Intelligence", "Data Science", "Computer Vision",
    "Natural Language Processing", "NLP", "TensorFlow", "Keras", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "Matplotlib", "Seaborn",
    "Hugging Face", "OpenCV", "Transformers",

    # Big Data & Analytics
    "Hadoop", "Spark", "Kafka", "Tableau", "Power BI", "Excel",

    # Mobile Development
    "React Native", "Flutter", "Swift", "Kotlin", "Android", "iOS",

    # Cybersecurity
    "Penetration Testing", "Ethical Hacking", "Cybersecurity", "Network Security", "Cryptography",

    # Misc Tools & Concepts
    "Agile", "Scrum", "REST API", "GraphQL", "Microservices", "OOP", "Data Structures", "Algorithms"
]

# --- File Reading Functions ---
def extract_text_from_pdf(pdf_path):
    text = ""
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def extract_text_from_docx(docx_path):
    return docx2txt.process(docx_path)


def extract_text_from_txt(txt_path):
    with open(txt_path, "r", encoding="utf-8", errors="ignore") as file:
        return file.read()


# --- Skill Extraction ---
def extract_skills(text, threshold=85):
    found_skills = set()
    for skill in SKILLS:
        match, score, _ = process.extractOne(skill, [text], scorer=fuzz.partial_ratio)
        if score >= threshold:
            found_skills.add(skill)
    return list(found_skills)


# --- Routes ---
@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "OK", "service": "ML Extractor"})


@app.route("/extract", methods=["POST"])
def extract():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    filename = file.filename

    temp_dir = "/tmp/uploads"
    os.makedirs(temp_dir, exist_ok=True)
    filepath = os.path.join(temp_dir, filename)

    file.save(filepath)

    try:
        if filename.lower().endswith(".pdf"):
            text = extract_text_from_pdf(filepath)
        elif filename.lower().endswith((".doc", ".docx")):
            text = extract_text_from_docx(filepath)
        elif filename.lower().endswith(".txt"):
            text = extract_text_from_txt(filepath)
        else:
            return jsonify({"error": "Unsupported file format"}), 400

        skills = extract_skills(text)
        return jsonify({"skills": skills, "count": len(skills)})

    except Exception as e:
        print(f"Extraction error: {e}")
        return jsonify({"error": "Failed to process file during extraction."}), 500

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


# --- Run Server ---
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
