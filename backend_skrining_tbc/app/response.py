from flask import jsonify, make_response


def success(value, message):
    response = {
        'data': value,
        'message': message
    }
    return make_response(jsonify(response)), 200

def bad_request(values, message):
    response = {
        'data': values,
        'message': message
    }
    return make_response(jsonify(response)), 400